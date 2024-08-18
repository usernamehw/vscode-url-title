import type { TextDocument } from 'vscode';

export const AsciiDoc = {
	isAsciidocFile(document: TextDocument): boolean {
		return document.uri.fsPath.endsWith('.adoc') ||
			document.uri.fsPath.endsWith('.asciidoc');
	},
	isAsciidocUrlHasTitle(urlString: string): boolean {
		return urlString.includes('[') &&
			urlString.endsWith(']');
	},
	getAsciidocUrl(urlString: string): string {
		if (AsciiDoc.isAsciidocUrlHasTitle(urlString)) {
			return urlString.slice(0, urlString.lastIndexOf('['));
		} else {
			return urlString;
		}
	},
};
