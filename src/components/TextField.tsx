import * as React from 'react';
import { wrapWc } from 'wc-react';

import '@bendera/vscode-webview-elements/dist/vscode-textfield/index.js';

const VsTextField = wrapWc(`vscode-textfield`);

export interface ITextFieldProps {
  label: string;
  error?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  validate?: (value: string) => Promise<void>;
}

export const TextField: React.FunctionComponent<ITextFieldProps> = ({
  label,
  error,
  value,
  placeholder,
  className,
  disabled,
  onChange,
  validate
}: React.PropsWithChildren<ITextFieldProps>) => {
  const [isInit, setIsInit] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!isInit && validate && value) {
      setIsInit(true);
      validate(value);
      return;
    }
  }, [validate, value])

  const elementRef = React.useCallback((node: any) => {
    if (node !== null) {
      node.addEventListener('vsc-change', (e: any) => {
        onChange ? onChange(e.target.value) : null;

        validate ? validate(e.target.value) : null;
      });
    }
  }, []);

  return (
    <div className={`textfield-container ${className || ""}`}>
      <label htmlFor={label.replace(/ /g, "-")}>
        {label}
      </label>
      <VsTextField
        ref={elementRef}
        id={label.replace(/ /g, "-")}
        label={label}
        value={value || ""}
        placeholder={placeholder}
        disabled={disabled}
        className='w-full border border-[var(--vscode-dropdown-border)] focus:border-[var(--vscode-focusBorder)]'>
      </VsTextField>

      {error ? <span className="error text-[--vscode-editorError-foreground]">{error}</span> : null}
    </div>
  );
};