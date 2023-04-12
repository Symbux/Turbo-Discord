import { AbstractService, Service, IService } from '@symbux/turbo';
import { Client, ClientEvents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Injector } from '@symbux/injector';
import { IActivityItem, IOptions } from '../types/base';
import { Session } from '../module/session';
import Router from '../module/router';

@Service('discord')
/**
 * The discord bot service class.
 *
 * @class DiscordService
 * @extends AbstractService
 * @implements IService
 * @plugin Turbo-Discord
 * @provides DiscordService, IOptions
 */
export class DiscordService extends AbstractService implements IService {
	private client!: Client;
	private controllers: Array<any> = [];
	private session: Session;
	private router: Router;
	private currentActivityIndex = 0;

	/**
	 * Creates an instance of the Discord bot service.
	 *
	 * @param options IOptions
	 * @constructor
	 */
	public constructor(options: IOptions) {
		super(options);
		Injector.register(this.constructor.name, this);
		Injector.register('tp.discord.options', this.options);

		// Initialise service modules.
		this.session = new Session();
		this.router = new Router(this.auth, this.session, this.client);
	}

	/**
	 * Initializes the discord bot and all settings if enabled.
	 *
	 * @returns Promise<void>
	 * @async
	 * @public
	 */
	public async initialise(): Promise<void> {

		// Check for valid bot information.
		if (typeof this.options.bot === 'undefined' || this.options.bot.token === 'undefined') {
			this.logger.warn('PLUGIN:DISCORD', 'No discord bot options found, aborting initialisation.');
			return;
		}

		// Create the discord bot client, and provide the discord client.
		this.logger.verbose('PLUGIN:DISCORD', 'Initialising the Discord service.');
		this.client = new Client({ intents: this.options.bot.intents || [] });
		Injector.register('discord', this.client);

		// Create a bot on ready method.
		this.client.on('ready', async () => {

			// Log the connection attempt.
			this.logger.info('PLUGIN:DISCORD', 'The Discord client has now successfully connected.');

			// Register the slash commands.
			await this.registerCommands();

			// Check for activities.
			if (this.options.bot.activities) {

				// Define the get next activity method.
				const getNextActivity = (activities: IActivityItem[]) => {
					if (this.currentActivityIndex >= activities.length) {
						this.currentActivityIndex = 0;
					}
					return activities[this.currentActivityIndex++];
				};

				// Re-type the activities.
				const activities = this.options.bot.activities as IActivityItem | IActivityItem[];
				const interval = this.options.bot.interval || 10;

				// Check if an array, and then call the get next activity function.
				if (activities instanceof Array) {

					// Set the first status.
					const activity = getNextActivity(activities);
					this.client.user?.setActivity({
						name: activity.text,
						type: activity.type,
						url: activity.url,
						shardId: activity.shardId,
					});

					// Create an interval to change the status.
					setInterval(() => {
						const activity = getNextActivity(activities);
						this.client.user?.setActivity({
							name: activity.text,
							type: activity.type,
							url: activity.url,
							shardId: activity.shardId,
						});
					}, interval * 60000);
				} else {

					// Set the only available status.
					this.client.user?.setActivity({
						name: activities.text,
						type: activities.type,
						url: activities.url,
						shardId: activities.shardId,
					});
				}
			}
		});

		// Now ask the router to initialise.
		this.router.initialise();
		this.setupEvents();
	}

	/**
	 * Starts the discord bot, if enabled.
	 *
	 * @returns Promise<void>
	 * @async
	 * @public
	 */
	public async start(): Promise<void> {
		if (this.options.bot && this.options.bot.token) {
			this.logger.info('PLUGIN:DISCORD', 'Starting the Discord service...');
			this.client.login(this.options.bot.token).catch(err => {
				this.logger.error('PLUGIN:DISCORD', `Failed to connect to discord, error: ${(err as Error).message}`, (err as Error));
			});
		}
	}

	/**
	 * Stops the discord bot, if enabled.
	 *
	 * @returns Promise<void>
	 * @async
	 * @public
	 */
	public async stop(): Promise<void> {
		if (this.options.bot && this.options.bot.token) {
			this.logger.verbose('PLUGIN:DISCORD', 'Stopping the Discord service...');
			await this.unregisterCommands();
			this.client.destroy();
			this.logger.verbose('PLUGIN:DISCORD', 'Discord service has been stopped.');
		}
	}

	/**
	 * Setup the command listeners for interactions, and events.
	 *
	 * @returns void
	 * @private
	 */
	private setupEvents(): void {

		// Create the interaction event.
		this.client.on('interactionCreate', interaction => {
			this.router.handle(interaction);
		});

		// Create generic event listeners, and link them up to the generic handler.
		if (this.options.bot.events && this.options.bot.events instanceof Array) {
			this.options.bot.events.forEach((event: keyof ClientEvents) => {
				this.client.on(event, (...args: any[]) => {
					this.router.handleEvent(event, args);
				});
			});
		}
	}

	private async registerCommands(): Promise<void> {
		if (!this.options.bot?.commands?.disableRegister) {

			// Notify the console.
			this.logger.verbose('PLUGIN:DISCORD', 'Forcing registering all commands, ignoring sync...');

			// Get the slash commands and then statistics.
			const slashCommands = this.router.getSlashCommands();
			const statistics = this.router.getStatistics();

			// Loop the guilds and set the commands.
			if (this.options.bot?.global) {
				const rest = new REST({ version: '9' }).setToken(this.options.bot.token);
				await rest.put(
					Routes.applicationCommands(this.options.oauth.id),
					{ body: slashCommands },
				);
			} else {
				await Promise.all(this.client.guilds.cache.map(async guild => {
					await guild.commands.set(slashCommands.map(c => c.toJSON()) as any);
				}));
			}

			// Notify the console.
			this.logger.verbose('PLUGIN:DISCORD', `Force registered ${statistics.commands} command(s), ${statistics.contexts} context menu(s), and ${statistics.events} event handler(s).`);
		}
	}

	private async unregisterCommands(): Promise<void> {
		if (!this.options.bot?.commands?.disableUnregister) {

			// Notify the console.
			this.logger.verbose('PLUGIN:DISCORD', 'Unregistering the commands...');

			// Loop the guilds and unregister the commands.
			await Promise.all(this.client.guilds.cache.map(async guild => {

				// Fetch the guild commands.
				const guildCommands = await guild.commands.fetch();

				// Loop the guild commands and delete.
				await Promise.all(guildCommands.map(async command => {
					await command.delete();
				}));

				// Notify the console.
				this.logger.verbose('PLUGIN:DISCORD', 'Commands have been unregistered.');
			}));
		}
	}
}
