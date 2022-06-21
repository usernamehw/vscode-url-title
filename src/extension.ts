import { ExtensionContext, workspace } from 'vscode';
import { registerExtensionCommands } from './commands';
import { ExtensionConfig } from './types';

export const enum Constants {
	ExtensionSettingsPrefix = 'urlTitle',
}

export let $config: ExtensionConfig;

export function activate(context: ExtensionContext) {
	updateConfig();
	registerExtensionCommands(context);

	function updateConfig() {
		$config = workspace.getConfiguration(Constants.ExtensionSettingsPrefix) as any as ExtensionConfig;
	}

	context.subscriptions.push(workspace.onDidChangeConfiguration(e => {
		if (!e.affectsConfiguration(Constants.ExtensionSettingsPrefix)) {
			return;
		}
		updateConfig();
	}));
}

export function deactivate() { }
