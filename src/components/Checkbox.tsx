import * as React from 'react';
import { wrapWc } from 'wc-react';

import '@bendera/vscode-webview-elements/dist/vscode-checkbox/index.js';

const VsCheckbox = wrapWc(`vscode-checkbox`);

export interface ICheckboxProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}

export const Checkbox: React.FunctionComponent<ICheckboxProps> = ({ label, value, onChange }: React.PropsWithChildren<ICheckboxProps>) => {

  const elementRef = React.useCallback((node: any) => {
    if (node !== null) {
      node.addEventListener('vsc-change', (e: any) => {
        onChange(e.target.checked);
      });
    }
  }, []);

  return (
    <VsCheckbox
      label={label}
      checked={value}
      ref={elementRef}
      className={`w-full`}></VsCheckbox>
  );
};