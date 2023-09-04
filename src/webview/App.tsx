import * as React from 'react';
import { Messenger, messageHandler } from '@estruyf/vscode/dist/client';
import "./styles.css";
import { useEffect } from 'react';
import { TemplateDetails, Argument } from '../models';
import { Button, Checkbox, Dropdown, FolderPicker, TextField } from '../components';
import CreatableSelect from 'react-select/creatable';

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
          <TextField
            label={argument.message}
            value={data[argument.name] || argument.default || ""}
            placeholder='Folder location'
            onChange={(value: string) => setData((prevData: any) => ({
              ...prevData,
              [argument.name]: value
            }))} />
        </div>
      );
    }

    if (argument.type === 'choice') {
      return (
        <Dropdown
          options={argument.options || []}
          label={argument.message}
          value={data[argument.name] || argument.default || ""}
          onChange={(value: string) => {
            if (value) {
              setData((prevData: any) => ({
                ...prevData,
                [argument.name]: value
              }))
            }
          }} />
      );
    }

    if (argument.type === 'freeform') {
      return (
        <CreatableSelect
          onChange={(value: any) => console.log(value)}
          isClearable
          options={(argument.options || []).map(o => ({
            label: o,
            value: o
          }))}
          styles={{
            control: (state) => ({
              ...state,
              backgroundColor: 'var(--vscode-settings-dropdownBackground)',
              borderColor: 'var(--vscode-settings-dropdownBorder)',
              color: 'var(--vscode-settings-dropdownForeground)',
              borderRadius: '2px',
              minHeight: 'auto',
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
            menu: (state) => ({
              ...state,
              backgroundColor: 'var(--dropdown-background)',
              borderColor: 'var(--dropdown-border)',
              color: 'var(--foreground)',
              borderRadius: '0px 0px 3px 3px',
              ":hover": {
                ...state[":hover"],
                backgroundColor: 'var(--list-hover-background)',
                color: 'var(--list-hover-foreground)'
              }
            }),
            dropdownIndicator: (state) => ({
              ...state,
              padding: "0",
              "svg": {
                width: "16px",
                height: "16px"
              }
            }),
            indicatorSeparator: (state) => ({
              ...state,
              display: "none"
            }),
            input: (state) => ({
              ...state,
              paddingTop: 0,
              paddingBottom: 0
            })
          }}
        />
      );
    }

    if (argument.type === 'boolean') {
      return (
        <div key={argument.name} className='flex flex-row mt-2 items-center'>
          <Checkbox
            label={argument.message}
            value={data[argument.name] || argument.default || false}
            onChange={(value: boolean) => setData((prevData: any) => ({
              ...prevData,
              [argument.name]: value
            }))} />
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
          <FolderPicker
            label='Folder'
            value={folder}
            onClick={pickFolder} />
        </div>

        <div className='flex gap-4 w-full mt-4'>
          <div className='w-1/2 '>
            <label>Project templates</label>
            <div className='h-80 overflow-auto border border-[var(--vscode-activityBar-border)]'>
              {
                templates.map((template) => {
                  return (
                    <button
                      key={template.title}
                      onClick={() => setSelected(template)}
                      className={`w-full text-left p-2 hover:bg-[var(--vscode-list-hoverBackground)] ${selected?.title === template.title ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]' : ''}`}
                    >
                      {
                        template.logo && (
                          <img src={template.logo} className='inline-block mr-2' style={{ height: `20px` }} />
                        )
                      }
                      {template.title}
                    </button>
                  );
                })
              }
            </div>
          </div>

          <div className='w-1/2'>
            <label>Project config</label>
            <div className='h-80 overflow-auto p-2 border border-[var(--vscode-activityBar-border)]'>
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
        </div>

        <div className='flex justify-end mt-4 space-x-2'>
          <Button
            secondary
            onClick={() => {
              setSelected(null);
              setData({});
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!folder}
            onClick={triggerCreation}
          >
            Create
          </Button>
        </div>
      </div>
    </div>
  );
};