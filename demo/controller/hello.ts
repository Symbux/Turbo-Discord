import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, MessageEmbed } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('faction-admin')
		.setDescription('Faction administration controls.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('info')
				.setDescription('Retrieves all the information about the faction.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('delete')
				.setDescription('Will delete the faction and all it\'s data.'),
		),
)
export default class FactionAdminCommand extends AbstractCommand {

	@On.SubCommand('info')
	public async onInfo(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();
		interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setTitle('Faction Administration')
					.setDescription('INFO')
					.setTimestamp(),
			],
		});
	}

	@On.SubCommand('delete')
	public async onDelete(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();
		interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setTitle('Faction Administration')
					.setDescription('DELETE')
					.setTimestamp(),
			],
		});
	}
}
