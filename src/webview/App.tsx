import * as React from 'react';
import { Messenger, messageHandler } from '@estruyf/vscode/dist/client';
import "./styles.css";
import { useEffect } from 'react';
import { TemplateDetails, Argument } from '../models';
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField, VSCodeDropdown, VSCodeOption } from '@vscode/webview-ui-toolkit/react';

export interface IAppProps { }

export const App: React.FunctionComponent<IAppProps> = ({ }: React.PropsWithChildren<IAppProps>) => {
  const [templates, setTemplates] = React.useState<TemplateDetails[]>([]);
  const [folder, setFolder] = React.useState<string>("");
  const [selected, setSelected] = React.useState<TemplateDetails | null>(null);
  const [data, setData] = React.useState<any>({});
  const [error, setError] = React.useState<string>("");

  const renderField = (argument: Argument) => {
    if (argument.hidden) {
      return null;
    }

    if (argument.type === 'string') {
      return (
        <div key={argument.name} className='flex flex-col mt-2'>
          <VSCodeTextField
            value={data[argument.name] || argument.default || ""}
            placeholder={argument.message}
            onInput={(e: any) => setData((prevData: any) => ({
              ...prevData,
              [argument.name]: e.target.value
            }))}>
            {argument.message}
          </VSCodeTextField>
        </div>
      );
    }

    if (argument.type === 'choice') {
      return (
        <div className="dropdown-container">
          <label htmlFor={argument.name.replace(/ /g, "-")}>{argument.message}</label>
          <VSCodeDropdown
            id={argument.name.replace(/ /g, "-")}
            className="w-full"
            position="below"
            value={data[argument.name] || argument.default || ""}
            onInput={(e: any) => {
              if (e.target.value) {
                setData((prevData: any) => ({
                  ...prevData,
                  [argument.name]: e.target.value
                }))
              }
            }}>
            <VSCodeOption></VSCodeOption>
            {
              (argument.options || []).map((option) => (
                <VSCodeOption>{option}</VSCodeOption>
              ))
            }
          </VSCodeDropdown>
        </div>
      );
    }

    if (argument.type === 'boolean') {
      return (
        <div key={argument.name} className='flex flex-row mt-2 items-center'>
          <VSCodeCheckbox
            value={data[argument.name] || argument.default || false}
            onChange={(e: any) => setData((prevData: any) => ({
              ...prevData,
              [argument.name]: e.target.checked
            }))}>
            {argument.message}
          </VSCodeCheckbox>
        </div>
      );
    }
  }

  const pickFolder = async () => {
    messageHandler.request<string>(`PICK_FOLDER`).then((result) => {
      if (typeof result === 'string') {
        setFolder(result);

        const prevState: any = Messenger.getState() || {};
        Messenger.setState({
          ...prevState,
          folder: result
        });

        messageHandler.send(`SET_STATE`, {
          key: "project-location",
          value: result
        })
      }
    }).catch((err) => {
      setError("");
    });
  };

  const triggerCreation = () => {
    if (!selected || !folder) {
      return;
    }

    messageHandler.send(`CREATE_PROJECT`, {
      folder,
      data,
      template: selected.template,
    });
  };


  useEffect(() => {
    messageHandler.request<TemplateDetails[]>(`GET_TEMPLATES`).then((result) => {
      setTemplates(result);
    }).catch((err) => {
      setError(err);
    });

    messageHandler.request<string>(`GET_STATE`, "project-location").then((result) => {
      setFolder(result || "");
    });
  }, []);

  return (
    <div className='h-full w-full flex items-center justify-center'>
      <div className='w-2/3'>
        <h1>Create a new project</h1>
        <h2 className='mt-3'>Frameworks/templates</h2>

        <div className='flex gap-4 w-full mt-4'>
          <VSCodeTextField
            placeholder='Folder location'
            value={folder}
            onClick={pickFolder}
            className='w-full'>
            Folder
          </VSCodeTextField>
        </div>

        <div className='flex gap-4 w-full mt-4'>
          <div className='w-1/2 h-80 overflow-auto border border-[var(--vscode-activityBar-border)]'>
            {
              templates.map((template) => {
                return (
                  <button
                    key={template.title}
                    onClick={() => setSelected(template)}
                    className={`w-full text-left p-2 hover:bg-[var(--vscode-list-hoverBackground)] ${selected?.title === template.title ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]' : ''}`}
                  >
                    {template.title}
                  </button>
                );
              })
            }
          </div>
          <div className='w-1/2 h-80 overflow-auto p-2 border border-[var(--vscode-activityBar-border)]'>
            {
              selected && (
                <div className='space-y-2'>
                  {
                    selected.template.arguments.map((argument) => (
                      renderField(argument)
                    ))
                  }
                </div>
              )
            }
          </div>
        </div>

        <div className='flex justify-end mt-4 space-x-2'>
          <VSCodeButton appearance="secondary" onClick={() => {
            setSelected(null);
            setData({});
          }}>Cancel</VSCodeButton>
          <VSCodeButton disabled={!folder} onClick={triggerCreation}>Create</VSCodeButton>
        </div>
      </div>
    </div>
  );
};