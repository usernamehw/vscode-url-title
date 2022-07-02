import { load } from 'cheerio';
import https from 'https';
import { commands, DocumentLink, Position, Range, TextDocument, TextEditor, window, workspace, WorkspaceEdit } from 'vscode';
import { $config } from '../extension';

export async function urlTitleRun(editor: TextEditor) {
	const targetLinks = await getLinksAtSelections(editor);
	const titles = await Promise.all(targetLinks.map(async link => getTitleFromUrl(link.target?.toString(true))));
	const edit = new WorkspaceEdit();

	for (const [index, targetLink] of targetLinks.entries()) {
		let title = titles[index];
		if (!title) {
			continue;
		}
		for (const removeFromTitle of $config.removeFromTitle) {
			title = title.replace(removeFromTitle, '');
		}
		if ($config.removeDomainFromTitle) {
			const domainName = domainNameFromHostname(targetLink.target!.authority);
			if (domainName) {
				const regex = new RegExp(` . ${domainName}$`, 'i');
				title = title.replace(regex, '');
			}
		}
		replaceLinkAtRangeEdit(edit, editor.document, targetLink, title);
	}

	workspace.applyEdit(edit);
}

async function getLinksAtSelections(editor: TextEditor) {
	const links = await commands.executeCommand<DocumentLink[]>('vscode.executeLinkProvider', editor.document.uri) ?? [];
	const targetLinks: DocumentLink[] = [];

	for (const selection of editor.selections) {
		for (const link of links) {
			if (selection.intersection(link.range)) {
				targetLinks.push(link);
			}
		}
	}

	return targetLinks;
}

async function getTitleFromUrl(url?: string): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!url) {
			resolve('');
			return;
		}
		https.request(url, async response => {
			if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303) {
				resolve(await getTitleFromUrl(response.headers.location));
				return;
			}
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				const $ = load(data);
				resolve($('head > title').text());
			});
		}).on('error', err => {
			window.showWarningMessage(err.message);
			reject(err.message);
		}).end();
	});
}

function replaceLinkAtRangeEdit(edit: WorkspaceEdit, document: TextDocument, targetLink: DocumentLink, title: string): void {
	if (targetLink.target?.scheme !== 'http' &&
		targetLink.target?.scheme !== 'https') {
		return;
	}
	if (isExistingMarkdownLink(document, targetLink)) {
		if (!$config.replaceExistingTitle) {
			return;
		}
		const lineNumber = targetLink.range.start.line;
		const entireLineText = document.lineAt(targetLink.range.start.line).text;
		const regex = /\[(.*?)\]\(.+?\)/ig;
		let match;
		while ((match = regex.exec(entireLineText)) !== null) {
			const matchIndex = match.index;
			const urlRange = new Range(lineNumber, matchIndex, lineNumber, matchIndex + match[0].length);
			const urlTitleRange = new Range(lineNumber, matchIndex + 1 /* left square bracket */, lineNumber, matchIndex + match[1].length + 1);
			if (urlRange.intersection(targetLink.range)) {
				edit.replace(document.uri, urlTitleRange, replaceNewlines(title));
				break;
			}
		}
	} else {
		edit.replace(document.uri, targetLink.range, `[${escapeSquareBrackets(replaceNewlines(title))}](${targetLink.target?.toString(true)})`);
	}
}
/**
 * Check if the link already has markdown link syntax (brackets around).
 * - not 100%, but likely
 */
function isExistingMarkdownLink(document: TextDocument, targetLink: DocumentLink): boolean {
	const range = targetLink.range;
	const rangeAroundLink = range.with(
		new Position(range.start.line, range.start.character - (range.start.character > 1 ? 2 : 0)),
		new Position(range.end.line, range.end.character + 1),
	);
	const textClosestAround = document.getText(rangeAroundLink);
	if (!textClosestAround) {
		return false;
	}
	if (textClosestAround.startsWith('](') && textClosestAround.endsWith(')')) {
		return true;
	}
	return false;
}

function replaceNewlines(str: string): string {
	return str.replace(/[\t\r\n]+/g, ' ')
		.replace(/ +/g, ' ');
}

/**
 * Escape square brackets (for markdown link title).
 */
function escapeSquareBrackets(str: string): string {
	return str.replace(/\[/g, '\\[')
		.replace(/\]/g, '\\]');
}

function domainNameFromHostname(hostname: string): string {
	const hostParts = hostname.split('.');
	return hostParts[hostParts.length - 2];
}
