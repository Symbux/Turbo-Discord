import {
	MessageEmbed, MessageActionRow, MessageButton, MessageButtonStyleResolvable, CommandInteraction, Message, MessageSelectMenu, TextChannel,
	User, ModalSubmitFieldsResolver, Modal, ModalActionRowComponent, MessageActionRowComponentResolvable, TextInputComponent, ModalSubmitInteraction,
} from 'discord.js';
import { ActionConfirmOptions, ActionChoiceItem, ActionSelectItem, ActionSelectOptions, ActionChoiceOptions, ActionModalOptions, ActionBaseOptions } from '../types/context';
import { Context } from '../service/context';
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

	/**
	 * Will ask a user for text input, either in the same channel or via DM.
	 *
	 * @param channel The channel or user to send the message to.
	 * @param question The question to send.
	 * @returns string | null
	 */
	public async input(channel: TextChannel | User, question: string): Promise<string | null> {

		// Send question and wait for message.
		const message = await channel.send(question);
		const response = await message.channel.awaitMessages({
			filter: m => m.author.id === message.author.id,
			max: 1,
			time: 240000,
			errors: ['time'],
		});

		// Check for answer.
		if (response.size > 0 && response.first()?.content) {
			return String(response.first()?.content);
		}

		// Return false.
		return null;
	}

	public async modal(title: string, components: TextInputComponent[], options?: ActionModalOptions): Promise<{
		interaction: ModalSubmitInteraction,
		fields: ModalSubmitFieldsResolver
	}> {

		// Create the modal.
		const modal = new Modal()
			.setTitle(title)
			.setCustomId('internal:modal-submit')
			.addComponents(...components.map(
				component => new MessageActionRow<ModalActionRowComponent>()
					.addComponents(component),
			));

		// Check for whether the interaction has been deferred or replied.
		const interaction = this.context.getInteraction<CommandInteraction>();
		if (interaction.replied || interaction.deferred) {
			throw new Error('When working with modals, you can not defer or reply to the interaction before calling the modal.');
		}

		// Now send the modal.
		await interaction.showModal(modal);

		// Await the result.
		const result = await interaction.awaitModalSubmit({
			time: options?.timeout || 300 * 1000,
		});

		// Return the fields resolver.
		return {
			interaction: result,
			fields: result.fields,
		};
	}

	/**
	 * Creates an action row, just a shortcut really.
	 *
	 * @param components The components to send.
	 * @returns MessageActionRow
	 */
	public createActionRow(...components: MessageActionRowComponentResolvable[] | MessageActionRowComponentResolvable[][]): MessageActionRow {
		return new MessageActionRow()
			.addComponents(...components);
	}

	/**
	 * Will create and return a select box.
	 *
	 * @param choices The choices to send.
	 * @param customId A custom ID.
	 * @param options The options for the select.
	 * @returns MessageSelectMenu
	 */
	public createSelect(choices: ActionSelectItem[], customId: string, options?: ActionSelectOptions): MessageSelectMenu {
		return new MessageSelectMenu()
			.setMinValues(options?.minValues || 1)
			.setMaxValues(options?.maxValues || 1)
			.setPlaceholder(options?.placeholder || 'Please select...')
			.setCustomId(customId)
			.setOptions(choices);
	}

	/**
	 * Will create and return a button.
	 *
	 * @param label The button label.
	 * @param style The button style.
	 * @param customId A custom ID.
	 * @returns MessageButton
	 */
	public createButton(label: string, style: MessageButtonStyleResolvable, customId: string): MessageButton {
		return new MessageButton()
			.setCustomId(customId)
			.setLabel(label)
			.setStyle(style);
	}

	/**
	 * Will create and return a message embed.
	 *
	 * @param question The question to send.
	 * @param options The options for the embed.
	 * @returns MessageEmbed
	 */
	public createEmbed(question: string, options?: ActionBaseOptions): MessageEmbed {
		const embed = new MessageEmbed();
		embed.setTitle(question);
		if (options?.description) embed.setDescription(options.description);
		if (options?.fields) embed.addFields(options.fields);
		return embed;
	}

	/**
	 * This will create a modal that can be sent to a user.
	 *
	 * @param title The title of the modal.
	 * @param customId A custom ID for the modal.
	 * @param components The text input components to send.
	 * @returns Modal
	 */
	public createModal(title: string, customId: string, components: TextInputComponent[]): Modal {
		return new Modal()
			.setTitle(title)
			.setCustomId(customId)
			.addComponents(...components.map(
				component => new MessageActionRow<ModalActionRowComponent>()
					.addComponents(component),
			));
	}
}
