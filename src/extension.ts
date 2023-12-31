// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { join } from "path";
import * as vscode from "vscode";
import { ExtensionContext, ExtensionMode, Uri, Webview } from "vscode";
import { MessageHandlerData } from "@estruyf/vscode";
import { getTemplates } from "./utils/getTemplates";
import { Argument, TemplateDetails } from "./models";
import { Extension } from "./services/Extension";
import { Executer } from "./services/CommandExecuter";
import { Commands } from "./constants";
import { Notifications } from "./services/Notifications";
import { Logger } from "./services/Logger";
import * as os from "os";
import { parseWinPath } from "./utils";

export function activate(context: vscode.ExtensionContext) {
  Extension.getInstance(context);

  let disposable = vscode.commands.registerCommand(
    "vscode-project-creation.newProject",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "create-project",
        "Create Project",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      panel.iconPath = {
        light: Uri.file(
          join(context.extensionPath, "assets/icons/add-light.svg")
        ),
        dark: Uri.file(
          join(context.extensionPath, "assets/icons/add-dark.svg")
        ),
      };

      panel.webview.onDidReceiveMessage(
        async (message) => {
          const { command, requestId, payload } = message;

          if (command === "GET_TEMPLATES") {
            const templates = await getTemplates(context);

            // Send a response back to the webview
            panel.webview.postMessage({
              command,
              requestId,
              payload: templates,
            } as MessageHandlerData<TemplateDetails[]>);
          } else if (command === "PICK_FOLDER") {
            const folderValue =
              context.globalState.get<string>(`project-location`);
            const folderUri = folderValue ? Uri.file(folderValue) : undefined;

            const folder = await vscode.window.showOpenDialog({
              canSelectFolders: true,
              canSelectFiles: false,
              canSelectMany: false,
              openLabel: "Select",
              title:
                "Select the parent folder where you want to create the project",
              defaultUri: folderUri,
            });

            if (folder && folder.length > 0) {
              panel.webview.postMessage({
                command,
                requestId,
                payload: folder[0].fsPath,
              } as MessageHandlerData<string>);
            } else if (typeof folder === "undefined") {
              panel.webview.postMessage({
                command,
                requestId,
                payload: undefined,
              } as MessageHandlerData<string | undefined>);
            }
          } else if (command === "GET_STATE") {
            const stateValue = context.globalState.get<any>(payload);
            panel.webview.postMessage({
              command,
              requestId,
              payload: stateValue,
            } as MessageHandlerData<any>);
          } else if (command === "SET_STATE") {
            context.globalState.update(payload.key, payload.value);
          } else if (command === "CREATE_PROJECT") {
            console.log(payload);
            const { folder, template, data } = payload;

            if (!folder) {
              return;
            }

            await vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Creating the new project... Check [output window](command:${Commands.showOutputChannel}) for more details`,
                cancellable: false,
              },
              async () => {
                const cmdArgs = [];
                let folderName = "";

                for (const arg of template.arguments as Argument[]) {
                  let value = data[arg.name] || arg.default || undefined;
                  if (arg.required && typeof value === "undefined") {
                    vscode.window.showErrorMessage(
                      `${arg.message} is required`
                    );
                    return;
                  }

                  if (typeof value !== "undefined") {
                    if (arg.type === "boolean") {
                      if (value) {
                        cmdArgs.push(`${arg.flag}`);
                      }
                    } else {
                      if (arg.removeSpaces) {
                        value = value.replace(/ /g, "_");
                      }

                      if (arg.isFolderName) {
                        folderName = value;
                      }

                      cmdArgs.push(`${arg.flag} ${value}`.trim());
                    }
                  }
                }

                const fullCommand = `${template.command} -- ${cmdArgs.join(
                  " "
                )}`;
                const result = await Executer.executeCommand(
                  folder,
                  fullCommand
                );

                if (result !== 0) {
                  Notifications.errorNoLog(
                    `Failed to create the project. Check [output window](command:${Commands.showOutputChannel}) for more details.`
                  );
                  return;
                }

                Logger.info(`Command result: ${result}`);

                if (os.platform() === "win32") {
                  await vscode.commands.executeCommand(
                    `vscode.openFolder`,
                    Uri.file(parseWinPath(join(folder, folderName)))
                  );
                } else {
                  await vscode.commands.executeCommand(
                    `vscode.openFolder`,
                    Uri.parse(join(folder, folderName))
                  );
                }
              }
            );
          }
        },
        undefined,
        context.subscriptions
      );

      panel.webview.html = getWebviewContent(context, panel.webview);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

const getWebviewContent = (context: ExtensionContext, webview: Webview) => {
  const jsFile = "webview.js";
  const localServerUrl = "http://localhost:9000";

  let scriptUrl = null;
  let cssUrl = null;

  const isProduction = context.extensionMode === ExtensionMode.Production;
  if (isProduction) {
    scriptUrl = webview
      .asWebviewUri(Uri.file(join(context.extensionPath, "dist", jsFile)))
      .toString();
  } else {
    scriptUrl = `${localServerUrl}/${jsFile}`;
  }

  return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		${isProduction ? `<link href="${cssUrl}" rel="stylesheet">` : ""}
	</head>
	<body>
		<div id="root"></div>

		<script src="${scriptUrl}"></script>
	</body>
	</html>`;
};
