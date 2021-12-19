export interface IConfirmOptions {
	shouldDelete?: boolean;
	timeout?: number;
	respond?: { text: string; deleteAfter?: number };
	labels?: { accept?: string; reject?: string; };
}
