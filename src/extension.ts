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
import { debounce, parseWinPath } from "./utils";
import { existsSync } from "fs";

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

      const debounceVerifyFolder = debounce();

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
          } else if (command === "SET_AUTO_OPEN") {
            if (typeof payload.value === "boolean") {
              const setting =
                vscode.workspace.getConfiguration("projectCreation");
              setting.update(
                "autoOpen",
                payload.value,
                vscode.ConfigurationTarget.Global
              );
            }
          } else if (command === "GET_AUTO_OPEN") {
            const setting =
              vscode.workspace.getConfiguration("projectCreation");
            const autoOpen = setting.get<boolean>("autoOpen");
            panel.webview.postMessage({
              command,
              requestId,
              payload: autoOpen,
            } as MessageHandlerData<boolean>);
          } else if (command === "VERIFY_FOLDER") {
            let { projectFolder, folder, field } = payload;

            if (!projectFolder || !folder) {
              panel.webview.postMessage({
                command,
                requestId,
                payload: undefined,
              } as MessageHandlerData<undefined>);
            }

            debounceVerifyFolder(async () => {
              if ((field as Argument).removeSpaces) {
                folder = folder.replace(/ /g, "_");
              }

              const absPath = join(projectFolder, folder);

              if (!existsSync(absPath)) {
                panel.webview.postMessage({
                  command,
                  requestId,
                  payload: "",
                } as MessageHandlerData<string>);
              } else {
                panel.webview.postMessage({
                  command,
                  requestId,
                  payload: "Folder already exists",
                } as MessageHandlerData<string>);
              }
            }, 300);
          } else if (command === "CREATE_PROJECT") {
            Logger.info(
              `Creating project with payload: ${JSON.stringify(payload)}`
            );

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
                  let value = undefined;

                  if (typeof data[arg.name] !== "undefined") {
                    value = data[arg.name];
                  } else if (typeof arg.default !== "undefined") {
                    value = arg.default;
                  }

                  if (arg.required && typeof value === "undefined") {
                    vscode.window.showErrorMessage(
                      `${arg.message} is required`
                    );
                    return;
                  }

                  if (typeof value !== "undefined") {
                    if (arg.type === "boolean") {
                      if (value && typeof arg.flag === "string") {
                        cmdArgs.push(`${arg.flag}`);
                      } else if (typeof arg.flag !== "string") {
                        if (value) {
                          cmdArgs.push(`${arg.flag.true}`);
                        } else {
                          cmdArgs.push(`${arg.flag.false}`);
                        }
                      }
                    } else if (typeof value === "string") {
                      if (arg.removeSpaces) {
                        value = value.replace(/ /g, "_");
                      }

                      if (arg.isFolderName) {
                        folderName = value;
                      }

                      if (value && arg.flag && typeof arg.flag === "string") {
                        cmdArgs.push(`${arg.flag} ${value}`.trim());
                      } else if (arg.flag && typeof arg.flag !== "string") {
                        if (value) {
                          cmdArgs.push(`${arg.flag.true} ${value}`.trim());
                        } else {
                          cmdArgs.push(`${arg.flag.false} ${value}`.trim());
                        }
                      } else if (value) {
                        cmdArgs.push(value);
                      }
                    }
                  } else if (arg.type == "divider") {
                    cmdArgs.push(arg.flag);
                  }
                }

                const fullCommand = `${template.command} ${cmdArgs.join(" ")}`;
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

  if (!vscode.workspace.workspaceFolders) {
    const setting = vscode.workspace.getConfiguration("projectCreation");
    const autoOpen = setting.get<boolean>("autoOpen");

    if (autoOpen) {
      vscode.commands.executeCommand("vscode-project-creation.newProject");
    }
  }

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
