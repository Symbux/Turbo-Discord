import { MessageContextMenuInteraction } from 'discord.js';
import { AbstractCommand, Add, Context, ContextMenu } from '../../src/index';

@ContextMenu()
export default class ReverseContext extends AbstractCommand {

	@Add.MessageContext('Reverse Message')
	public async onReverseMessage(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<MessageContextMenuInteraction>();

		// Check for valid message.
		const message = context.getContextMessage();
		if (!message) {
			await interaction.editReply('No message found.');
			return;
		}

		// If valid message, get content, reverse and return.
		await interaction.editReply(message.content.split('').reverse().join(''));
	}

	@Add.UserContext('Reverse Name')
	public async onReverseName(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<MessageContextMenuInteraction>();

		// Check for valid user.
		const user = context.getContextUser();
		if (!user) {
			await interaction.editReply('No user found.');
			return;
		}

		// If valid message, get content, reverse and return.
		await interaction.editReply(user.username.split('').reverse().join(''));
	}

	@Add.MessageContext('Test Message Access')
	public async onTestMessageAccess(context: Context): Promise<void> {
		console.log(
			'Test Message Access',
			context.getLanguages(),
			context.getAuth(),
			context.getRaw(),
			context.getUser(),
			context.getGuild(),
			context.getGuildMember(),
			context.getChannel(),
			context.getClient(),
		);
	}

	@Add.UserContext('Test User Access')
	public async onTestUserAccess(context: Context): Promise<void> {
		console.log(
			'Test User Access',
			context.getLanguages(),
			context.getAuth(),
			context.getRaw(),
			context.getUser(),
			context.getGuild(),
			context.getGuildMember(),
			context.getChannel(),
			context.getClient(),
		);
	}
}
