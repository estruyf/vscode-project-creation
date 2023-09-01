import * as React from 'react';
import { wrapWc } from 'wc-react';

import '@bendera/vscode-webview-elements/dist/vscode-single-select/index.js';
import '@bendera/vscode-webview-elements/dist/vscode-option/index.js';

const VsSingleSelect = wrapWc(`vscode-single-select`);
const VsOption = wrapWc(`vscode-option`);

export interface ISelectProps {
  options: string[];
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

export const Dropdown: React.FunctionComponent<ISelectProps> = ({ options, label, value, onChange }: React.PropsWithChildren<ISelectProps>) => {

  const elementRef = React.useCallback((node: any) => {
    const listener = (e: any) => {
      onChange(e.target.value);
    };

    if (node !== null) {
      node.addEventListener('vsc-change', listener);
    }

    return () => {
      if (node !== null) {
        node.removeEventListener('vsc-change', listener);
      }
    }
  }, []);

  return (
    <div className="dropdown-container">
      <label htmlFor={label.replace(/ /g, "-")}>{label}</label>
      <VsSingleSelect
        ref={elementRef}
        id={label.replace(/ /g, "-")}
        className={`w-full`}>
        <VsOption selected={!value}></VsOption>
        {
          (options || []).map((option) => (
            <VsOption selected={value === option}>{option}</VsOption>
          ))
        }
      </VsSingleSelect>
    </div>
  );
};