import * as React from 'react';
import { Button } from './Button';

export interface IFolderPickerProps {
  label: string;
  value: string;
  onClick?: () => void;
}

export const FolderPicker: React.FunctionComponent<IFolderPickerProps> = ({ label, value, onClick }: React.PropsWithChildren<IFolderPickerProps>) => {
  return (
    <div className="w-full">
      <label htmlFor={label.replace(/ /g, "-")}>{label}</label>
      <div className='folder_picker'>
        <Button onClick={onClick}>Choose folder</Button>
        <input
          id={label.replace(/ /g, "-")}
          type="text"
          value={value}
          disabled />
      </div>
    </div>
  );
};