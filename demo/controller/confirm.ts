import { AbstractCommand, Command, Context, On } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Auth } from '@symbux/turbo';
import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } from 'discord.js';
import { CommandInteraction } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('confirm')
		.setDescription('Will simply ask you a random question.'),
)
export default class UsersCommand extends AbstractCommand {

	@On.Command()
	@Auth.InArray('roles', 'Admin')
	public async command(context: Context): Promise<void> {

		// Defer the reply.
		await context.defer();

		// Testing the confirm functionality in succession.
		// // Get the interaction.
		// const interaction = context.getInteraction<CommandInteraction>();

		// // Answer questions.
		// const answer1 = await context.confirm('Do you like cookies?');
		// const answer2 = await context.confirm('Do you like cats?');
		// const answer3 = await context.confirm('Do you like dogs?');

		// // Send the answers.
		// await interaction.editReply({
		// 	content: `You answered: ${answer1}, ${answer2}, ${answer3}`,
		// 	embeds: [],
		// 	components: [],
		// });

		// Testing the confirm functionality.
		// await context.confirm('Hello :)', {
		// 	labels: {
		// 		accept: 'Hello!',
		// 		reject: 'Goodbye!',
		// 	},
		// 	respond: {
		// 		text: 'Thanks for answering!',
		// 		deleteAfter: 20 * 1000,
		// 	},
		// });

		// Get the interaction.
		const interaction = context.getInteraction<CommandInteraction>();

		// Create an embed.
		const embed = new MessageEmbed()
			.setTitle('Answer this question...')
			.setDescription('Who is cooler, you or you?');

		// Create the buttons.
		const buttonRow = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId(`${this.getUniqueKey()}:yes`)
					.setLabel('Yes')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId(`${this.getUniqueKey()}:no`)
					.setLabel('No')
					.setStyle('DANGER'),
			);

		// Create the select menu.
		const selectRow = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId(`${this.getUniqueKey()}:animal`)
					.setPlaceholder('Select an option...')
					.addOptions([
						{
							label: 'Chicken',
							description: 'A chicken is a bird.',
							value: 'chicken',
						},
						{
							label: 'Cat',
							description: 'A cat is a cat.',
							value: 'cat',
						},
					]),
			);

		// Send the response.
		await interaction.editReply({
			embeds: [embed],
			components: [buttonRow, selectRow],
		});
	}

	@On.Button('yes')
	@Auth.InArray('roles', 'Admin')
	public async buttonYes(context: Context): Promise<void> {
		console.log(context, 'UsersCommand::buttonYes');
	}

	@On.Button('no')
	@Auth.InArray('roles', 'Admin')
	public async buttonNo(context: Context): Promise<void> {
		console.log(context, 'UsersCommand::buttonNo');
	}

	@On.SelectMenu('animal')
	@Auth.InArray('roles', 'Admin')
	public async selectMenu(context: Context): Promise<void> {
		console.log(context, 'UsersCommand::selectMenu');
	}
}
