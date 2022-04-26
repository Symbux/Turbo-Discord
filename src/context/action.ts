import { MessageEmbed, MessageActionRowComponentResolvable, MessageActionRow, MessageButton, MessageButtonStyleResolvable, CommandInteraction, Message, MessageSelectMenu } from 'discord.js';
import { ActionBaseOptions, ActionConfirmOptions, ActionChoiceItem, ActionSelectItem, ActionSelectOptions, ActionChoiceOptions } from '../types/context';
import { Context } from '../service/context';
import { randomBytes } from 'node:crypto';
import { ILogger } from '@symbux/turbo';
import { Inject } from '@symbux/injector';

export class ContextActions {
	@Inject('logger') private logger!: ILogger;
	public constructor(private context: Context) {}

	public async confirm(question: string, options?: ActionConfirmOptions): Promise<boolean | null> {

		// Verify the reply has been deferred.
		const interaction = this.context.getInteraction<CommandInteraction>();
		if (!interaction.deferred) {
			await interaction.deferReply({
				ephemeral: options?.ephermeral ?? true,
			});
		}

		// Create the embed.
		const embed = this.createEmbed(question, options);

		// Create the buttons.
		const buttons = this.createActionRow(
			this.createButton(options?.labels?.accept || 'Yes', 'SUCCESS', 'internal:confirm:accept'),
			this.createButton(options?.labels?.reject || 'No', 'DANGER', 'internal:confirm:reject'),
		);

		// Send the confirmation.
		const message = await interaction.editReply({
			embeds: [ embed ],
			components: [ buttons ],
		});

		// Create collector and await it.
		const collectedInteraction = await (message as Message).awaitMessageComponent({
			filter: async i => {
				await i.deferUpdate();
				return i.user.id === interaction.user.id;
			},
			componentType: 'BUTTON',
			time: options?.timeout || 60 * 1000,
		}).catch(() => this.logger.warn('DISCORD', 'CONFIRM Action was not replied to.'));
		if (!collectedInteraction) return null;

		// Check and return result.
		return collectedInteraction.customId === 'internal:confirm:accept';
	}

	public async choice(question: string, choices: ActionChoiceItem[], options?: ActionChoiceOptions): Promise<string | null> {

		// Verify choices are no more than 5.
		if (choices.length > 5) throw new Error('Too many choices, for choices over 5 use the select method.');

		// Verify the reply has been deferred.
		const interaction = this.context.getInteraction<CommandInteraction>();
		if (!interaction.deferred) {
			await interaction.deferReply({
				ephemeral: options?.ephermeral ?? true,
			});
		}

		// Create the embed.
		const embed = this.createEmbed(question, options);

		// Create the buttons.
		const buttons = this.createActionRow(...choices.map(choice => {
			return this.createButton(choice.name, choice.style || 'PRIMARY', `internal:choice:${choice.value}`);
		}));

		// Send the confirmation.
		const message = await interaction.editReply({
			embeds: [ embed ],
			components: [ buttons ],
		});

		// Create collector and await it.
		const collectedInteraction = await (message as Message).awaitMessageComponent({
			filter: async i => {
				await i.deferUpdate();
				return i.user.id === interaction.user.id;
			},
			componentType: 'BUTTON',
			time: options?.timeout || 60 * 1000,
		}).catch(() => this.logger.warn('DISCORD', 'CHOICE Action was not replied to.'));
		if (!collectedInteraction) return null;

		// Check and return result.
		return String(collectedInteraction.customId).replace('internal:choice:', '');
	}

	public async select(question: string, choices: ActionSelectItem[], options?: ActionSelectOptions): Promise<string[] | null> {

		// Verify choices are no more than 25.
		if (choices.length > 25) throw new Error('Discord does not support more than 25 choices, consider using an auto-complete command.');

		// Verify the reply has been deferred.
		const interaction = this.context.getInteraction<CommandInteraction>();
		if (!interaction.deferred) {
			await interaction.deferReply({
				ephemeral: options?.ephermeral ?? true,
			});
		}

		// Create the embed.
		const embed = this.createEmbed(question, options);

		// Create the buttons.
		const dropdown = this.createActionRow(
			this.createSelect(choices, 'internal:select:choice', options),
		);

		// Send the confirmation.
		const message = await interaction.editReply({
			embeds: [ embed ],
			components: [ dropdown ],
		});

		// Create collector and await it.
		const collectedInteraction = await (message as Message).awaitMessageComponent({
			filter: async i => {
				await i.deferUpdate();
				return i.user.id === interaction.user.id;
			},
			componentType: 'SELECT_MENU',
			time: options?.timeout || 60 * 1000,
		}).catch(() => this.logger.warn('DISCORD', 'SELECT Action was not replied to.'));
		if (!collectedInteraction) return null;

		// Check and return result.
		return collectedInteraction.values;
	}

	private createActionRow(...components: MessageActionRowComponentResolvable[] | MessageActionRowComponentResolvable[][]): MessageActionRow {
		return new MessageActionRow()
			.addComponents(...components);
	}

	private createSelect(choices: ActionSelectItem[], customId: string, options?: ActionSelectOptions): MessageSelectMenu {
		return new MessageSelectMenu()
			.setMinValues(options?.minValues || 1)
			.setMaxValues(options?.maxValues || 1)
			.setPlaceholder(options?.placeholder || 'Please select...')
			.setCustomId(customId)
			.setOptions(choices);
	}

	private createButton(label: string, style: MessageButtonStyleResolvable, customId: string): MessageButton {
		return new MessageButton()
			.setCustomId(customId)
			.setLabel(label)
			.setStyle(style);
	}

	private createEmbed(question: string, options?: ActionBaseOptions): MessageEmbed {
		const embed = new MessageEmbed();
		embed.setTitle(question);
		if (options?.description) embed.setDescription(options.description);
		if (options?.fields) embed.addFields(options.fields);
		return embed;
	}

	private generateToken(): string {
		return randomBytes(16).toString('hex');
	}
}
