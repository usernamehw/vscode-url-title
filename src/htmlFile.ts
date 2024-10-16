import type { Position, Range, TextDocument } from 'vscode';

export const HtmlFile = {
	isHtmlFile(document: TextDocument): boolean {
		return document.uri.fsPath.endsWith('.html') ||
			document.uri.fsPath.endsWith('.htm');
	},
	/**
	 * If it's an axisting link tag <a>, return its entire range.
	 */
	getRangeToReplace(document: TextDocument, position: Position): Range | undefined {
		const range = document.getWordRangeAtPosition(position, /<a [^>]+?>.+?<\/a>/);
		return range;
	},
};
