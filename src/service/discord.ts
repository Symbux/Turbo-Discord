import { AbstractService, Service, IService, Registry, DecoratorHelper } from '@symbux/turbo';
import { Client, Interaction, CacheType, CommandInteraction, SelectMenuInteraction, ButtonInteraction, ClientEvents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Injector } from '@symbux/injector';
import { IActivityItem, IOptions } from '../types/base';
import { Wait } from '../helper/misc';
import { Context } from './context';
import { GenericContext } from './generic-context';
import { Queue } from '../module/queue';
import { Session } from '../module/session';

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

	/**
	 * Initializes the discord bot and all settings if enabled.
	 *
	 * @returns Promise<void>
	 * @async
	 * @public
	 */
	public async initialise(): Promise<void> {

		// Firstly check the bot or oauth section exists.
		if (!this.options.bot && !this.options.oauth) {
			this.logger.warn('PLUGIN:DISCORD', 'No discord bot or oauth options found, aborting initialisation.');
			return;
		}

		// Create the discord bot client, if options present.
		if (this.options.bot, this.options.bot.token) {
			this.logger.verbose('PLUGIN:DISCORD', 'Initialising the Discord service.');
			this.client = new Client({ intents: this.options.bot.intents || [] });
			Injector.register('discord', this.client);
			this.client.on('ready', async () => {
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
				await this.registerCommands();
				await this.registerEvents();
			});

			// Setup and handle the controllers.
			const controllers = Registry.getModules('controller');
			this.controllers = controllers.filter(controller => {
				controller.events = false;
				controller.isGeneric = false;
				controller.methods = DecoratorHelper.getMetadata('t:methods', [], controller.instance);
				const requiredPlugin = DecoratorHelper.getMetadata('t:plugin', 'none', controller.module);
				return requiredPlugin === 'discord';
			});

			// Setup incoming events.
			this.setupEvents();
		}
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
			this.logger.info('PLUGIN:DISCORD', 'Starting the Discord service.');
			this.client.login(this.options.bot.token).catch(err => {
				const loginError = err as Error;
				this.logger.error('PLUGIN:DISCORD', `Failed to connect to discord, error: ${loginError.message}`, loginError);
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
			this.logger.info('PLUGIN:DISCORD', 'Unregistering the slash commands.');
			await this.unregisterCommands();
			this.logger.info('PLUGIN:DISCORD', 'Stopping the Discord service.');
			this.client.destroy();
		}
	}

	/**
	 * Registers the generic events for Discord.
	 *
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
	private async registerEvents(): Promise<void> {

		// Let's loop the controllers and check for generic handlers.
		this.controllers.forEach(controller => {

			// Check if this controller is a generic type.
			const isGeneric = DecoratorHelper.getMetadata('t:discord:type', '', controller.module);
			if (isGeneric !== 'generic') return false;

			// Assign the events to the controller.
			controller.isGeneric = true;
			controller.events = [];

			// Now loop and map the events.
			controller.eventsMap = {};
			for (const propertyKey in controller.methods) {

				// Define a unique property as an array, assign the class method.
				const unique = controller.methods[propertyKey].unique;
				if (typeof controller.eventsMap[unique] === 'undefined') controller.eventsMap[unique] = [];
				controller.eventsMap[unique].push(propertyKey);

				// Assign any events into the controller events list.
				if (controller.events.includes(unique)) continue;
				controller.events.push(unique);
			}
		});
	}

	/**
	 * Register the commands based on the imported controllers.
	 *
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
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
			controller.uniqueSubNames = {};
			for (const propertyKey in controller.methods) {
				const isSubcommand = controller.methods[propertyKey].subcommand;
				const uniqueId = controller.methods[propertyKey].unique;
				if (!isSubcommand) {
					if (uniqueId !== false) {
						controller.uniqueNames[uniqueId] = propertyKey;
					} else {
						controller.uniqueNames._ = propertyKey;
					}
				} else {
					controller.uniqueSubNames[uniqueId] = propertyKey;
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

	// Unregister the commands with all connected guilds.
	private async unregisterCommands(): Promise<void> {
		await Promise.all(this.client.guilds.cache.map(async guild => {
			const guildCommands = await guild.commands.fetch();
			await Promise.all(guildCommands.map(async command => {
				await command.delete();
			}));
		}));
	}

	/**
	 * Set's up the interaction and generic events.
	 *
	 * @returns void
	 * @private
	 */
	private setupEvents(): void {

		// Create the interaction event.
		this.client.on('interactionCreate', interaction => {
			this.handleInteraction(interaction);
		});

		// Create generic event listeners, and link them up to the generic handler.
		if (this.options.bot.events && this.options.bot.events instanceof Array) {
			this.options.bot.events.forEach((event: keyof ClientEvents) => {
				this.client.on(event, (...args: any[]) => {
					this.handleEvent(event, ...args);
				});
			});
		}
	}

	/**
	 * Accepts the generic event from discord and passes it to a handler to
	 * be routed and dispatched using the GenericContext, rather than the main
	 * context due to the untyped nature.
	 *
	 * @param event The event name.
	 * @param args The event arguments.
	 * @private
	 * @async
	 */
	private async handleEvent(event: keyof ClientEvents, ...args: any[]): Promise<void> {
		try {

			// Verify the controller.
			const controllers = this.getEventControllers(event);
			if (controllers.length === 0) throw new Error('Could not find valid controller(s) to serve the event.');

			// Now loop the controllers.
			controllers.forEach(controller => {

				// Check for handler for the event, if none, ignore.
				if (typeof controller.eventsMap[event] === 'undefined') return;

				// Now let's loop the methods.
				controller.eventsMap[event].forEach(async (controllerMethod: string) => {

					// Create the context.
					const context = new GenericContext(this.client, event, args, this.queue, this.session);

					// Check for authentication checks.
					const authChecks = DecoratorHelper.getMetadata('t:auth:checks', [], controller.instance, controllerMethod);
					if (authChecks.length > 0) {
						this.logger.warn('AUTH', 'Authentication checks are not supported for generic events due to their un-typed nature.');
					}

					// Now call the method with the context.
					await controller.instance[controllerMethod](context);
				});
			});

		} catch(err) {

			// Log any error.
			this.logger.error('PLUGIN:DISCORD', `Failed to handle generic event, error: ${(err as Error).message}`, (err as Error));
		}
	}

	/**
	 * Accepts the interaction and dispatches it to the specific handler.
	 *
	 * @param interaction The interaction.
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
	private async handleInteraction(interaction: Interaction<CacheType>): Promise<void> {
		try {

			// On command interaction.
			if (interaction.isCommand()) {

				// Get subcommand name.
				const subCommand = interaction.options.getSubcommand(false);

				// If no subcommand, run the default.
				if (!subCommand) {
					await this.onCommand(interaction);
				} else {
					await this.onSubCommand(interaction, subCommand);
				}
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
				interaction.editReply({
					content: ':warning:  There was a problem completing that command.',
				});
			}
		}
	}

	/**
	 * Handles the incoming command interactions.
	 *
	 * @param interaction The command interaction.
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
	private async onCommand(interaction: CommandInteraction<CacheType>): Promise<void> {

		// Verify the controller.
		const controller = this.getController(interaction.commandName);
		if (!controller) throw new Error('Could not find valid controller to serve the command.');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueNames).includes('_')) throw new Error(`No valid method found to serve the command interaction with command: ${interaction.commandName}.`);
		const controllerMethod = controller.uniqueNames._;

		// Found, let's build a context.
		const context = new Context(interaction, 'command', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			this.logger.warn('PLUGIN:DISCORD', 'The command was stopped by middleware.');
			return;
		}

		// Now call the method with the context.
		await controller.instance[controllerMethod](context);
	}

	/**
	 * Handles the incoming sub command interactions.
	 *
	 * @param interaction The command interaction.
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
	private async onSubCommand(interaction: CommandInteraction<CacheType>, subCommand: string): Promise<void> {

		// Verify the controller.
		const controller = this.getController(interaction.commandName);
		if (!controller) throw new Error('Could not find valid controller to serve the command.');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueSubNames).includes(subCommand)) throw new Error(`No valid method found to serve the sub-command interaction with sub-command: ${subCommand}.`);
		const controllerMethod = controller.uniqueSubNames[subCommand];

		// Found, let's build a context.
		const context = new Context(interaction, 'subcommand', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			this.logger.warn('PLUGIN:DISCORD', 'The command was stopped by middleware.');
			return;
		}

		// Now call the method with the context.
		await controller.instance[controllerMethod](context);
	}

	/**
	 * Handles the incoming button interactions.
	 *
	 * @param interaction The button interaction.
	 * @returns Promise<void>
	 * @private
	 * @async
	 */
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
		if (!controller) throw new Error('Could not find valid controller to serve the command.');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueNames).includes(value)) throw new Error(`No valid method found to serve the button interaction with unique key: ${customId}/${value}.`);
		const controllerMethod = controller.uniqueNames[value];

		// Found, let's build a context.
		const context = new Context(interaction, 'button', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			this.logger.warn('PLUGIN:DISCORD', 'The command was stopped by middleware.');
			return;
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
		if (!controller) throw new Error('Could not find valid controller to serve the command.');

		// Now we need to find the default command.
		if (!Object.keys(controller.uniqueNames).includes(value)) throw new Error(`No valid method found to serve the select-menu interaction with unique key: ${customId}/${value}.`);
		const controllerMethod = controller.uniqueNames[value];

		// Found, let's build a context.
		const context = new Context(interaction, 'selectmenu', this.queue, this.session);

		// Now we need to run authentication.
		const authResponse = await this.auth.handle('discord', context, controller.instance, controllerMethod);
		if (authResponse.failed && authResponse.stop) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Check for standard stop.
		if (!authResponse.failed && authResponse.stop) {
			this.logger.warn('PLUGIN:DISCORD', 'The command was stopped by middleware.');
			return;
		}

		// Now call the method with the context.
		await controller.instance[controllerMethod](context);
	}

	/**
	 * Will get and return a controller based on if it handles the
	 * given generic event.
	 *
	 * @param commandName The name of the command.
	 * @returns AbstractController | false
	 * @private
	 */
	private getEventControllers(event: keyof ClientEvents): any[] {
		return this.controllers.filter(controller => {
			if (!controller.isGeneric) return false;
			return controller.events.includes(event);
		});
	}

	/**
	 * Will get and return a controller by the name, or false
	 * if not found.
	 *
	 * @param commandName The name of the command.
	 * @returns AbstractController | false
	 * @private
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
	 * @private
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
	 * @private
	 */
	private getNextActivity(activities: IActivityItem[]): IActivityItem {
		if (this.currentActivityIndex >= activities.length) {
			this.currentActivityIndex = 0;
		}
		return activities[this.currentActivityIndex++];
	}
}
