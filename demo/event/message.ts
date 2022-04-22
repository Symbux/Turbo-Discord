import { AbstractEvent, On, Event, GenericContext } from '../../src/index';
import { Message } from 'discord.js';

@Event()
export default class MessageEvent extends AbstractEvent {

	@On.Event('messageCreate')
	public async onMessageCreate(context: GenericContext): Promise<void> {

		// Define the message, and reject all bots.
		const message: Message = context.getArguments()[0];
		if (message.author.bot) return;

		// Notify console.
		console.log(`Received message: ${message.author.username}.`);
	}
}
