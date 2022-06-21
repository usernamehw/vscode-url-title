import { commands, ExtensionContext } from 'vscode';
import { urlTitleRun } from './commands/urlTitleRun';

/**
 * All command ids contributed by this extension.
 */
export const enum CommandId {
	Run = 'urlTitle.run',
}

export function registerExtensionCommands(context: ExtensionContext) {
	context.subscriptions.push(commands.registerTextEditorCommand(CommandId.Run, urlTitleRun));
}
