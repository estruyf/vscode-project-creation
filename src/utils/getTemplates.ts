import { ExtensionContext } from "vscode";
import { join } from "path";
import { readFile, readdir } from "fs/promises";
import { TemplateDetails } from "../models";

export const getTemplates = async (
  context: ExtensionContext
): Promise<TemplateDetails[]> => {
  const tempPath = join(context.extensionPath, "/templates");
  const tempPaths = await readdir(tempPath);
  const templates: TemplateDetails[] = [];

  for (const temp of tempPaths) {
    const tempPath = join(context.extensionPath, "/templates", temp);
    const content = await readFile(tempPath, "utf-8");

    if (content) {
      const contentJson = JSON.parse(content);
      templates.push(contentJson);
    }
  }

  return templates;
};
