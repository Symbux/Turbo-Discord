import { On, GenericContext, Event, AbstractEvent } from '../../src/index';
import { Message } from 'discord.js';

@Event()
export default class MessageEvent extends AbstractEvent {

	@On.Event('messageCreate')
	public async handle(context: GenericContext): Promise<void> {
		const message: Message = context.getArguments()[0];
		console.log(`Received message: ${message.content} from ${message.author.username}`);
	}
}
