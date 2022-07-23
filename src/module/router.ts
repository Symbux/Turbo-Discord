import { ContextMenuCommandBuilder, SlashCommandBuilder } from '@discordjs/builders';
import { Inject, Injector } from '@symbux/injector';
import { Registry, DecoratorHelper, ILogger, Authentication } from '@symbux/turbo';
import { Interaction, CacheType, ClientEvents, Client, InteractionType } from 'discord.js';
import { Wait } from '../helper/misc';
import Handler from './handler';
import { Session } from './session';

/**
 * The discord bot service class.
 *
 * @class Router
 * @plugin Turbo-Discord
 * @provides tp.discord.router
 */
export default class Router {
	@Inject('logger') private logger!: ILogger;
	private slashCommands: Array<SlashCommandBuilder | ContextMenuCommandBuilder> = [];
	private statistics = { commands: 0, contexts: 0, events: 0 };
	private controllers: Array<any> = [];
	private handler: Handler;
	private maps: Record<string, Map<string, any>> = {};

	/**
	 * Creates an instance of the Router class.
	 *
	 * @plugin Turbo-Discord
	 */
	public constructor(private auth: Authentication, private session: Session, private client: Client) {
		this.handler = new Handler(this.auth, this, this.session, this.client);
		Injector.register('tp.discord.router', this);
	}

	/**
	 * Initialises the router and starts processing the controllers.
	 */
	public async initialise(): Promise<void> {

		// Get the controllers.
		const controllers = Registry.getModules('controller');
		this.controllers = controllers.filter(controller => {
			const requiredPlugin = DecoratorHelper.getMetadata('t:plugin', 'none', controller.module);
			if (requiredPlugin !== 'discord') return false;
			controller.name = controller.instance.constructor.name;
			controller.type = DecoratorHelper.getMetadata('t:discord:type', 'command', controller.module);
			controller.methods = DecoratorHelper.getMetadata('t:methods', [], controller.instance);
			return true;
		});

		// Process the controllers.
		this.processControllers();
	}

	private processControllers(): void {

		// Setup the core mapping.
		if (!this.maps['command']) this.maps['command'] = new Map<string, Record<string, any>>();
		if (!this.maps['context']) this.maps['context'] = new Map<string, Record<string, any>>();
		if (!this.maps['generic']) this.maps['generic'] = new Map<string, Record<string, any>>();
		if (!this.maps['subcommand']) this.maps['subcommand'] = new Map<string, Record<string, any>>();
		if (!this.maps['selectmenu']) this.maps['selectmenu'] = new Map<string, Record<string, any>>();
		if (!this.maps['button']) this.maps['button'] = new Map<string, Record<string, any>>();
		if (!this.maps['modal']) this.maps['modal'] = new Map<string, Record<string, any>>();
		if (!this.maps['autocomplete']) this.maps['autocomplete'] = new Map<string, Record<string, any>>();

		// Now loop the controllers.
		this.controllers.forEach(controller => {

			// Process controller commands.
			if (controller.type === 'command') {
				const command: SlashCommandBuilder = DecoratorHelper.getMetadata('t:discord:command', null, controller.module);
				if (!command) return;
				this.slashCommands.push(command);

				// Increment the statistics.
				this.statistics.commands++;

				// Now process the methods for it.
				Object.entries(controller.methods).forEach(([methodName, method]: [string, any]) => {

					// If method is default command, map it.
					if (method.type === 'command') {
						this.maps['command'].set(command.name, {
							controllerName: controller.name,
							methodName: methodName,
							type: method.type,
							auth: method.auth,
						});
						return;
					}

					// If method is subcommand, map it.
					if (method.type === 'subcommand') {
						this.maps['subcommand'].set(`${command.name}:${method.unique}`, {
							controllerName: controller.name,
							methodName: methodName,
							type: method.type,
							auth: method.auth,
						});
						return;
					}

					// If method is context command, map it.
					if (method.type === 'context') {
						this.maps['context'].set(method.name, {
							controllerName: controller.name,
							methodName: methodName,
							type: 'context',
							auth: method.auth,
						});
						return;
					}

					// If method is autocomplete command, map it.
					if (method.type === 'autocomplete') {
						this.maps[method.type].set(`${command.name}:${method.unique}`, {
							controllerName: controller.name,
							methodName: methodName,
							type: method.type,
							auth: method.auth,
						});
						return;
					}

					// Dynamic methods (select menu, modal submit, button, etc.)
					this.maps[method.type].set(`${controller.name}:${method.unique}`, {
						controllerName: controller.name,
						methodName: methodName,
						type: method.type,
						auth: method.auth,
					});
				});

			// Process controller context commands.
			} else if (controller.type === 'context') {
				Object.entries(controller.methods).forEach(([methodName, method]: [string, any]) => {
					this.slashCommands.push(
						new ContextMenuCommandBuilder()
							.setName(method.name)
							.setType(method.subtype === 'Message' ? 3 : 2),
					);

					// Increment the statistics.
					this.statistics.contexts++;

					// Now let's map these.
					this.maps['context'].set(method.name, {
						controllerName: controller.name,
						methodName: methodName,
						type: method.subtype === 'Message' ? 'message' : 'user', // message = 3, user = 2
						auth: method.auth,
					});
				});

			// Process generic commands.
			} else if (controller.type === 'generic') {

				// Now loop the methods.
				Object.entries(controller.methods).forEach(([methodName, method]: [string, any]) => {

					// Let's map the generic events.
					if (!this.maps['generic'].has(method.unique)) this.maps['generic'].set(method.unique, []);
					if (this.maps['generic'].has(method.unique)) {
						this.maps['generic'].get(method.unique).push({
							controllerName: controller.name,
							methodName: methodName,
							type: method.subtype === 'Message' ? 3 : 2,
							auth: method.auth,
						});
					}

					// Increment the statistics.
					this.statistics.events++;
				});
			}
		});

		console.log(this.maps);
	}

	public async handle(interaction: Interaction<CacheType>): Promise<void> {
		try {

			// On command interaction.
			if (interaction.isChatInputCommand()) {

				// Get subcommand name.
				const subCommand = interaction.options.getSubcommand(false);

				// If no subcommand, run the default.
				if (!subCommand) {
					await this.handler.onCommand(interaction);
				} else {
					await this.handler.onSubCommand(interaction, subCommand);
				}
			}

			// On button interaction.
			if (interaction.isButton()) {
				await this.handler.onButton(interaction);
			}

			// On select menu interaction.
			if (interaction.isSelectMenu()) {
				await this.handler.onSelectMenu(interaction);
			}

			// On context menu interaction.
			if (interaction.isContextMenuCommand()) {
				await this.handler.onContextMenu(interaction);
			}

			// On autocomplete interaction.
			if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
				await this.handler.onAutocomplete(interaction);
			}

			// On modal interaction.
			if (interaction.type === InteractionType.ModalSubmit) {
				await this.handler.onModalSubmit(interaction);
			}
		} catch(err) {

			// Log any error.
			this.logger.error('PLUGIN:DISCORD', `Failed to handle interaction, error: ${(err as Error).message}`, (err as Error));

			// Wait 100 ms.
			await Wait(100);

			// Send the error to the user.
			if (interaction.isChatInputCommand()) {
				if (interaction.replied) {
					interaction.editReply({
						content: ':warning:  There was a problem completing that command.',
					});
				} else {
					interaction.reply({
						content: ':warning:  There was a problem completing that command.',
					});
				}
			}
		}
	}

	public async handleEvent(event: keyof ClientEvents, args: any[]): Promise<void> {
		try {
			await this.handler.onGenericEvent(event, args);
		} catch(err) {
			this.logger.error('PLUGIN:DISCORD', `Failed to handle generic event, error: ${(err as Error).message}`, (err as Error));
		}
	}

	public lookupMappingContext(type: string, name: string): Record<string, any> {
		if (!this.maps[type]) throw new Error(`Could not find mapping type: ${type}.`);
		if (!this.maps[type].has(name)) throw new Error(`Could not find mapping name: ${name} for type: ${type}.`);

		// Get the mapping.
		const mapping = this.maps[type].get(name);

		// Apply the controller information.
		if (mapping instanceof Array) {
			mapping.forEach(mapping => {
				mapping.controller = this.controllers.find((controller: Record<string, any>) => {
					return controller.name === mapping.controllerName;
				});
				if (!mapping.controller) {
					throw new Error(`Could not find generic controller for: ${name} for type: ${type} and controller name: ${mapping.controllerName}.`);
				}
			});
		} else {
			mapping.controller = this.controllers.find((controller: Record<string, any>) => {
				return controller.name === mapping.controllerName;
			});
			if (!mapping.controller) {
				throw new Error(`Could not find controller for: ${name} for type: ${type} and controller name: ${mapping.controllerName}.`);
			}
		}

		// Return the mapping.
		return mapping;
	}

	public getSlashCommands(): Array<SlashCommandBuilder | ContextMenuCommandBuilder> {
		return this.slashCommands;
	}

	public getStatistics() {
		return this.statistics;
	}
}
