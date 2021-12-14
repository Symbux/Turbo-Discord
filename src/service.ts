import { AbstractService, Service, IService, ILogger } from '@symbux/turbo';
import { Client, Intents } from 'discord.js';
import { Inject } from '@symbux/injector';
import { IOptions } from './types';

@Service('discord')
export class DiscordService extends AbstractService implements IService {

	@Inject('logger') public logger!: ILogger;
	public client!: Client;

	public constructor(options: IOptions) {
		super(options);
	}

	public async initialise(): Promise<void> {
		this.logger.verbose('DISCORD', 'Initialising the Discord service.');
		this.client = new Client({ intents: [ Intents.FLAGS.GUILDS ]});
		this.client.on('ready', () => {
			this.logger.info('DISCORD', 'The discord bot is now connected.');
			this.client.user?.setActivity(this.options.startActivity);
		});
	}

	public async start(): Promise<void> {
		this.logger.info('DISCORD', 'Starting the Discord service.');
		this.client.login(this.options.discordToken).catch(err => {
			const loginError = err as Error;
			this.logger.error('DISCORD', `Failed to connect to discord, error: ${loginError.message}`, loginError);
		});
	}

	public async stop(): Promise<void> {
		this.logger.info('DISCORD', 'Stopping the Discord service.');
		this.client.destroy();
	}
}
