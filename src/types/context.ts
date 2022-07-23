import { ButtonBuilder } from '@discordjs/builders';
import { SelectMenuBuilder, ButtonStyle, EmbedField } from 'discord.js';

export interface ActionChoiceItem {
	name: string;
	value: string;
	style?: ButtonStyle,
}

export interface ActionSelectItem {
	label: string;
	value: string;
	description?: string;
	default?: boolean;
}

export interface ActionBaseOptions {
	ephermeral?: boolean;
	timeout?: number;
	description?: string;
	fields?: EmbedField[],
}

export interface ActionConfirmOptions extends ActionBaseOptions {
	labels?: {
		accept?: string;
		reject?: string;
	};
}

export interface ActionSelectOptions extends ActionBaseOptions {
	minValues?: number;
	maxValues?: number;
	placeholder?: string;
}

export interface ActionModalOptions {
	timeout?: number;
}

export type AnyMessageComponentBuilder = ButtonBuilder | SelectMenuBuilder;

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface ActionChoiceOptions extends ActionBaseOptions {}
/* eslint-enable @typescript-eslint/no-empty-interface */
