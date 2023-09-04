import * as React from 'react';
import CreatableSelect from 'react-select/creatable';

export interface IEditableSelectProps {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}

export const EditableSelect: React.FunctionComponent<IEditableSelectProps> = ({
  label,
  options,
  value,
  onChange
}: React.PropsWithChildren<IEditableSelectProps>) => {
  return (
    <div className="editable-container">
      <label htmlFor={label.replace(/ /g, "-")}>{label}</label>
      <CreatableSelect
        id={label.replace(/ /g, "-")}
        onChange={(value: any) => onChange(value.value)}
        isClearable
        options={(options || []).map(o => ({
          label: o,
          value: o
        }))}
        defaultValue={value ? { label: value, value: value } : ""}
        placeholder={`Select or create...`}
        styles={{
          control: (state) => ({
            ...state,
            backgroundColor: 'var(--vscode-settings-dropdownBackground)',
            borderColor: 'var(--vscode-settings-dropdownBorder)',
            color: 'var(--vscode-settings-dropdownForeground)',
            borderRadius: '2px',
            minHeight: 'auto',
            padding: "3px 4px",
            boxShadow: 'none',
            ":focus": {
              ...state[":focus"],
              borderColor: 'var(--vscode-focusBorder)',
              outline: 'none'
            },
            ":hover": {
              ...state[":hover"],
              borderColor: 'var(--vscode-focusBorder)',
              outline: 'none'
            }
          }),
          valueContainer: (state) => ({
            ...state,
            padding: "0px"
          }),
          menu: (state) => ({
            ...state,
            backgroundColor: 'var(--vscode-settings-dropdownBackground)',
            border: '1px solid var(--vscode-dropdown-border)',
            color: 'var(--vscode-foreground)',
            borderRadius: '0px 0px 3px 3px',
            marginTop: "0px",
          }),
          option: (state) => ({
            ...state,
            backgroundColor: 'transparent',
            color: 'inherit',
            padding: "1px 3px",
            minHeight: "calc(var(--vscode-font-size) * 1.3)",
            ":hover": {
              ...state[":hover"],
              backgroundColor: 'var(--vscode-list-hoverBackground)',
              color: 'var(--vscode-list-hoverForeground)',
            }
          }),
          dropdownIndicator: (state) => ({
            ...state,
            padding: "0",
            marginRight: "5px",
            "svg": {
              width: "14px",
              height: "14px"
            }
          }),
          clearIndicator: (state) => ({
            ...state,
            padding: 0,
            marginRight: "4px",
            "svg": {
              width: "14px",
              height: "14px"
            }
          }),
          indicatorSeparator: (state) => ({
            ...state,
            display: "none"
          }),
          singleValue: (state) => ({
            ...state,
            color: 'var(--vscode-foreground)',
          }),
          input: (state) => ({
            ...state,
            padding: 0,
            margin: 0,
            color: 'var(--vscode-foreground)',
            "::placeholder": {
              ...state["::placeholder"],
              color: 'var(--vscode-input-placeholderForeground)'
            }
          })
        }}
      />
    </div>
  );
};