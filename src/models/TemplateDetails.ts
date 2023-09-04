export interface TemplateDetails {
  title: string;
  description: string;
  url: string;
  icons: Icons;
  template: Template;
}

export interface Icons {
  light: string;
  dark: string;
}

export interface Template {
  command: string;
  arguments: Argument[];
}

export interface Argument {
  name: string;
  message: string;
  default: boolean | string;
  required: boolean;
  flag: string;
  type: string;
  options?: string[];
  hidden?: boolean;
  isFolderName?: boolean;
  removeSpaces?: boolean;
}
