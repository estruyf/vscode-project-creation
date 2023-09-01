import * as React from 'react';
import { wrapWc } from 'wc-react';

import '@bendera/vscode-webview-elements/dist/vscode-textfield/index.js';

const VsTextField = wrapWc(`vscode-textfield`);

export interface ITextFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export const TextField: React.FunctionComponent<ITextFieldProps> = ({
  label,
  value,
  placeholder,
  className,
  disabled,
  onChange
}: React.PropsWithChildren<ITextFieldProps>) => {

  const elementRef = React.useCallback((node: any) => {
    if (node !== null) {
      node.addEventListener('vsc-change', (e: any) => {
        onChange ? onChange(e.target.value) : null;
      });
    }
  }, []);

  return (
    <div className={`textfield-container ${className || ""}`}>
      <label htmlFor={label.replace(/ /g, "-")}>{label}</label>
      <VsTextField
        ref={elementRef}
        id={label.replace(/ /g, "-")}
        label={label}
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        className='w-full border border-[var(--vscode-dropdown-border)] focus:border-[var(--vscode-focusBorder)]'>
      </VsTextField>
    </div>
  );
};