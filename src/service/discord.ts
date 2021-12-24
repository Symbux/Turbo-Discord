import { AbstractService, Service, IService, Registry, DecoratorHelper } from '@symbux/turbo';
import { Client, Intents, Interaction, CacheType, CommandInteraction, SelectMenuInteraction, ButtonInteraction } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Injector } from '@symbux/injector';
import { IActivityItem, IOptions } from '../types/base';
import { Wait } from '../helper/misc';
import { Context } from './context';
import { Queue } from '../module/queue';
import { Session } from '../module/session';

@Service('discord')
/**
 * The discord bot service class.
 *
 * @class DiscordService
 * @extends AbstractService
 * @implements IService
 * @plugin Discord
 * @inject logger
 * @provides DiscordService, IOptions
 */
export class DiscordService extends AbstractService implements IService {
	private client!: Client;
	private controllers: Array<any> = [];
	private queue: Queue;
	private session: Session;
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
		this.queue = new Queue();
		this.session = new Session();
	}

	public async initialise(): Promise<void> {

		// Firstly check the bot or oauth section exists.
		if (!this.options.bot && !this.options.oauth) {
			this.logger.warn('PLUGIN:DISCORD', 'No discord bot or oauth options found, aborting initialisation.');
			return;
		}

		// Create the discord bot client, if options present.
		if (this.options.bot, this.options.bot.token) {
			this.logger.verbose('PLUGIN:DISCORD', 'Initialising the Discord service.');
			this.client = new Client({ intents: [ Intents.FLAGS.GUILDS ]});
			this.client.on('ready', () => {
				this.logger.info('PLUGIN:DISCORD', 'The discord bot is now connected.');

				// Check for activities.
				if (this.options.bot.activities) {

					// Re-type the activities.
					const activities = this.options.bot.activities as IActivityItem | IActivityItem[];
					const interval = this.options.bot.interval || 10;

					// Check if an array, and then call the get next activity function.
					if (activities instanceof Array) {

						// Set the first status.
						const activity = this.getNextActivity(activities);
						this.client.user?.setActivity({
							name: activity.text,
							type: activity.type,
							url: activity.url,
							shardId: activity.shardId,
						});

						// Create an interval to change the status.
						setInterval(() => {
							const activity = this.getNextActivity(activities);
							this.client.user?.setActivity({
								name: activity.text,
								type: activity.type,
								url: activity.url,
								shardId: activity.shardId,
							});
						}, interval * 60000);
					} else {
						this.client.user?.setActivity({
							name: activities.text,
							type: activities.type,
							url: activities.url,
							shardId: activities.shardId,
						});
					}
				}

				// Register the commands, once connected.
				this.registerCommands();
			});

			// Setup and handle the controllers.
			const controllers = Registry.getModules('controller');
			this.controllers = controllers.filter(controller => {
				controller.methods = DecoratorHelper.getMetadata('t:methods', [], controller.instance);
				const requiredPlugin = DecoratorHelper.getMetadata('t:plugin', 'none', controller.module);
				return requiredPlugin === 'discord';
			});

			// Setup incoming events.
			this.setupEvents();
		}
	}

	public async start(): Promise<void> {
		if (this.options.bot && this.options.bot.token) {
			this.logger.info('PLUGIN:DISCORD', 'Starting the Discord service.');
			this.client.login(this.options.bot.token).catch(err => {
				const loginError = err as Error;
				this.logger.error('PLUGIN:DISCORD', `Failed to connect to discord, error: ${loginError.message}`, loginError);
			});
		}
	}

	public async stop(): Promise<void> {
		if (this.options.bot && this.options.bot.token) {
			this.logger.info('PLUGIN:DISCORD', 'Stopping the Discord service.');
			this.client.destroy();
		}
	}

	private async registerCommands(): Promise<void> {

		// Define the slash commands array.
		this.logger.verbose('PLUGIN:DISCORD', 'Retrieving the commands.');
		const slashCommands: Array<any> = [];

		// Loop the controllers and get the commands.
		this.controllers.forEach(controller => {

			// Get the slash command, and verify.
			const slashCommand: SlashCommandBuilder = DecoratorHelper.getMetadata('t:discord:command', null, controller.module);
			if (!slashCommand) return;

			// Add the command.
			slashCommands.push(slashCommand.toJSON());

			// Define some meta data.
			controller.command = slashCommand.name;
			controller.unique = controller.instance.getUniqueKey();

			// Define the unique names.
			controller.uniqueNames = {};
			for (const propertyKey in controller.methods) {
				const uniqueId = controller.methods[propertyKey].unique;
				if (uniqueId !== false) {
					controller.uniqueNames[uniqueId] = propertyKey;
				} else {
					controller.uniqueNames._ = propertyKey;
				}
			}

			// Note found command.
			this.logger.verbose('PLUGIN:DISCORD', `Found command: ${slashCommand.name}.`);
		});

		// Register the commands with all connected guilds.
		this.client.guilds.cache.forEach(async guild => {
			const request = new REST({ version: '9' }).setToken(this.options.bot.token);
			const userId = this.client.user?.id;
			if (!userId) throw new Error('Failed to get the user id from client.');
			await request.put(Routes.applicationGuildCommands(userId, guild.id), { body: slashCommands });
		});

		// Note success.
		this.logger.verbose('PLUGIN:DISCORD', `Registered ${slashCommands.length} commands.`);
	}

	private setupEvents(): void {
		this.client.on('interactionCreate', interaction => {
			this.handleInteraction(interaction);
		});
	}

	private async handleInteraction(interaction: Interaction<CacheType>): Promise<void> {
		try {

			// On command interaction.
			if (interaction.isCommand()) {
				await this.onCommand(interaction);
			}

			// On button interaction.
			if (interaction.isButton()) {
				await this.onButton(interaction);
			}

			// On select menu interaction.
			if (interaction.isSelectMenu()) {
				await this.onSelectMenu(interaction);
			}

		} catch(err) {

			// Log any error.
			this.logger.error('PLUGIN:DISCORD', `Failed to handle interaction, error: ${(err as Error).message}`, (err as Error));

			// Wait 250 ms.
			await Wait(100);

			// Send the error to the user.
			if (interaction.isCommand()) {
				if (!interaction.replied) {
					return interaction.reply({
						content: ':warning:  There was a problem completing that command.',
						ephemeral: true,
					});
				}
			}
		}
	}

	private async onCommand(interaction: CommandInteraction<CacheType>): Promise<void> {

		// Verify the controller.
		const controller = this.getController(interaction.commandName);
		if (!controller) throw new Error('NO_CONTROLLER');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueNames).includes('_')) throw new Error('NO_METHOD');
		const controllerMethod = controller.uniqueNames._;

		// Found, let's build a context.
		const context = new Context(interaction, 'command', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			throw new Error('AUTH_FAILED');
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			throw new Error('NO_EXECUTE');
		}

		// Now call the method with the context.
		await controller.instance[controllerMethod](context);
	}

	private async onButton(interaction: ButtonInteraction<CacheType>): Promise<void> {

		// Define data.
		const [customId, value] = interaction.customId.split(':');

		// Check if the value is an internal checking function.
		if (customId.startsWith('internal')) return;

		// Firstly let's check the queue.
		const queueItem = this.queue.get(customId, interaction.user.id);
		if (queueItem !== null) {
			queueItem.resolve([value, interaction]);
			return;
		}

		// Now we need to check for controllers matching the first part of the custom ID.
		const controller = this.getControllerByCustomId(customId);
		if (!controller) throw new Error('NO_CONTROLLER');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueNames).includes(value)) throw new Error('NO_METHOD');
		const controllerMethod = controller.uniqueNames[value];

		// Found, let's build a context.
		const context = new Context(interaction, 'command', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			throw new Error('AUTH_FAILED');
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			throw new Error('NO_EXECUTE');
		}

		// Now call the method with the context.
		await controller.instance[controllerMethod](context);
	}

	/**
	 * Will process the select menu interaction.
	 *
	 * @param interaction The interaction for the event.
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
	private async onSelectMenu(interaction: SelectMenuInteraction<CacheType>): Promise<void> {
		console.log(interaction);
	}

	/**
	 * Will get and return a controller by the name, or false
	 * if not found.
	 *
	 * @param commandName The name of the command.
	 * @returns AbstractController | false
	 */
	private getController(commandName: string): any {
		const controllers = this.controllers.filter(controller => controller.command === commandName);
		if (controllers.length === 0) return false;
		return controllers[0];
	}

	/**
	 * Will get and return a controller by custom ID, or false
	 * if not found.
	 *
	 * @param customId The custom ID of the controller.
	 * @returns AbstractController | false
	 */
	private getControllerByCustomId(customId: string): any {
		const controllers = this.controllers.filter(controller => controller.unique === customId);
		if (controllers.length === 0) return false;
		return controllers[0];
	}

	/**
	 * Will return the next activity item from the given array.
	 *
	 * @param activities The activities array.
	 * @returns IActivityItem
	 */
	private getNextActivity(activities: IActivityItem[]): IActivityItem {
		if (this.currentActivityIndex >= activities.length) {
			this.currentActivityIndex = 0;
		}
		return activities[this.currentActivityIndex++];
	}
}
