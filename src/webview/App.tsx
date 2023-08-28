import * as React from 'react';
import { messageHandler } from '@estruyf/vscode/dist/client';
import "./styles.css";
import { useEffect } from 'react';
import { TemplateDetails, Argument } from '../models';
import { VSCodeButton, VSCodeCheckbox, VSCodeTextField } from '@vscode/webview-ui-toolkit/react';

export interface IAppProps { }

export const App: React.FunctionComponent<IAppProps> = ({ }: React.PropsWithChildren<IAppProps>) => {
  const [templates, setTemplates] = React.useState<TemplateDetails[]>([]);
  const [error, setError] = React.useState<string>("");
  const [selected, setSelected] = React.useState<TemplateDetails | null>(null);

  const renderField = (argument: Argument) => {
    if (argument.hidden) {
      return null;
    }

    if (argument.type === 'string') {
      return (
        <div key={argument.name} className='flex flex-col mt-2'>
          <VSCodeTextField onInput={(e: any) => console.log(e.currentTarget.value)}>{argument.message}</VSCodeTextField>
        </div>
      )
    }

    if (argument.type === 'boolean') {
      return (
        <div key={argument.name} className='flex flex-row mt-2 items-center'>
          <VSCodeCheckbox>{argument.message}</VSCodeCheckbox>
        </div>
      )
    }
  }

  useEffect(() => {
    messageHandler.request<TemplateDetails[]>(`GET_TEMPLATES`).then((result) => {
      setTemplates(result);
    }).catch((err) => {
      setError(err);
    });
  }, []);

  return (
    <div className='h-full w-full flex items-center justify-center'>
      <div className='w-2/3'>
        <h1>Create a new project</h1>
        <h2 className='mt-3'>Frameworks/templates</h2>

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
                <div>
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
          <VSCodeButton appearance="secondary" onClick={() => setSelected(null)}>Cancel</VSCodeButton>
          <VSCodeButton>Create</VSCodeButton>
        </div>
      </div>
    </div>
  );
};