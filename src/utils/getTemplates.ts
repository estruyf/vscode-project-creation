import { ExtensionContext, workspace } from "vscode";
import { join } from "path";
import { readFile, readdir } from "fs/promises";
import { TemplateDetails } from "../models";

export const getTemplates = async (
  context: ExtensionContext
): Promise<TemplateDetails[]> => {
  const config = workspace.getConfiguration(`projectCreation`);
  const categoriesIgnore = config.get<string[]>("categories.ignore") || [];
  const languagesIgnore = config.get<string[]>("languages.ignore") || [];

  const tempPath = join(context.extensionPath, "/templates");
  const tempPaths = await readdir(tempPath);
  const templates: TemplateDetails[] = [];

  for (const temp of tempPaths) {
    const tempPath = join(context.extensionPath, "/templates", temp);
    const content = await readFile(tempPath, "utf-8");

    if (content) {
      const contentJson = JSON.parse(content);

      if (contentJson.categories.length > 0 && categoriesIgnore.length > 0) {
        // Check if the template has a category that needs to be ignored
        const hasCategory = contentJson.categories.some((c: string) =>
          categoriesIgnore.includes(c)
        );

        if (hasCategory) {
          continue;
        }
      }

      if (contentJson.languages.length > 0 && languagesIgnore.length > 0) {
        // Check if the template has a language that needs to be ignored
        const hasLanguage = contentJson.languages.some((c: string) =>
          languagesIgnore.includes(c)
        );

        if (hasLanguage) {
          continue;
        }
      }

      templates.push(contentJson);
    }
  }

  return templates;
};
