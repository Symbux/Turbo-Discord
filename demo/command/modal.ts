import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle, CommandInteraction, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('modal')
		.setDescription('Command to test the new modals.')
		.addSubcommand(command =>
			command
				.setName('command')
				.setDescription('Testing modals being inline and awaited.'),
		)
		.addSubcommand(command =>
			command
				.setName('interaction')
				.setDescription('Testing modals being called and then linked by an interaction.'),
		)
		.addSubcommand(command =>
			command
				.setName('button')
				.setDescription('Testing modals being called from a button.'),
		),
)
export default class ModalCommand extends AbstractCommand {

	@On.SubCommand('command')
	public async onModalCommand(context: Context): Promise<void> {
		const { interaction, fields } = await context.action.modal('Modal Command Test', [
			new TextInputBuilder()
				.setLabel('Name')
				.setCustomId('name')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('Enter your name.'),
			new TextInputBuilder()
				.setLabel('Your Biography')
				.setCustomId('biography')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('Describe yourself.'),
		]);
		await interaction.reply(`Your name is ${fields.getTextInputValue('name')} and your biography is ${fields.getTextInputValue('biography')}.`);
	}

	@On.SubCommand('interaction')
	public async onModalInteraction(context: Context): Promise<void> {
		const interaction = context.getInteraction<CommandInteraction>();
		const modal = context.action.createModal('Modal Interaction Test', 'ModalCommand:interaction-modal', [
			new TextInputBuilder()
				.setLabel('Name')
				.setCustomId('name')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('Enter your name.'),
			new TextInputBuilder()
				.setLabel('Your Biography')
				.setCustomId('biography')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('Describe yourself.'),
		]);
		interaction.showModal(modal);
	}

	@On.ModalSubmit('interaction-modal')
	public async onModalInteractionSubmit(context: Context): Promise<void> {
		const interaction = context.getInteraction<ModalSubmitInteraction>();
		await context.respond(`Your name is ${interaction.fields.getTextInputValue('name')} and your biography is ${interaction.fields.getTextInputValue('biography')}.`);
	}

	@On.SubCommand('button')
	public async onButtonModalCreate(context: Context): Promise<void> {
		await context.respond({
			content: 'Press this button to open a form',
			components: [
				context.action.createActionRow(
					context.action.createButton('Open Modal', ButtonStyle.Primary, 'ModalCommand:interaction-button-open'),
				),
			],
		});
	}

	@On.Button('interaction-button-open')
	public async onModalInteractionButtonOpen(context: Context): Promise<void> {
		const interaction = context.getInteraction<CommandInteraction>();
		const modal = context.action.createModal('Modal Button Test', 'ModalCommand:interaction-modal', [
			new TextInputBuilder()
				.setLabel('Name')
				.setCustomId('name')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Short)
				.setPlaceholder('Enter your name.'),
			new TextInputBuilder()
				.setLabel('Your Biography')
				.setCustomId('biography')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder('Describe yourself.'),
		]);
		interaction.showModal(modal);
	}
}
