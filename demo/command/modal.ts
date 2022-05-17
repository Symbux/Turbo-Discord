import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { TextInputComponent } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('modal')
		.setDescription('Command to test the new modals.'),
)
export default class ModalCommand extends AbstractCommand {

	@On.Command()
	public async onCommand(context: Context): Promise<void> {
		const { interaction, fields } = await context.action.modal('Modal Form Test', [
			new TextInputComponent()
				.setLabel('Name')
				.setCustomId('name')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle('SHORT')
				.setPlaceholder('Enter your name.'),
			new TextInputComponent()
				.setLabel('Your Biography')
				.setCustomId('biography')
				.setMinLength(0)
				.setMaxLength(25)
				.setRequired(true)
				.setStyle('PARAGRAPH')
				.setPlaceholder('Describe yourself.'),
		]);
		await interaction.reply(`Your name is ${fields.getTextInputValue('name')} and your biography is ${fields.getTextInputValue('biography')}.`);
	}
}
