
export interface ExtensionConfig {
	/**
	 * Always remove these strings from the fetched title.
	 */
	removeFromTitle: string[];
	/**
	 * When checked - and the markdown link already has brackets & title - still fetch the new title and replace the old one.
	 */
	replaceExistingTitle: boolean;
	/**
	 * When checked - try to remove the domain name from the end of the title.
	 */
	removeDomainFromTitle: boolean;
}
