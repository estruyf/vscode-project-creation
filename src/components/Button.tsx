import * as React from 'react';
import { wrapWc } from 'wc-react';

import '@bendera/vscode-webview-elements/dist/vscode-button/index.js';

const VsButton = wrapWc(`vscode-button`);

export interface IButtonProps {
  disabled?: boolean;
  secondary?: boolean;
  onClick?: () => void;
}

export const Button: React.FunctionComponent<React.PropsWithChildren<IButtonProps>> = ({
  disabled,
  secondary,
  onClick,
  children
}: React.PropsWithChildren<IButtonProps>) => {
  return (
    <VsButton
      secondary={secondary}
      disabled={disabled}
      onClick={onClick}
      className={`outline-none focus:outline-none`}>
      {children}
    </VsButton>
  );
};