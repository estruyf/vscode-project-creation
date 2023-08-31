export interface TemplateDetails {
  title: string;
  description: string;
  url: string;
  logo: string;
  template: Template;
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
