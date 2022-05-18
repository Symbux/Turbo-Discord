import { Inject } from '@symbux/injector';
import { Authentication, ILogger } from '@symbux/turbo';
import { AutocompleteInteraction, ButtonInteraction, ContextMenuInteraction, ModalSubmitInteraction, SelectMenuInteraction, ClientEvents, CommandInteraction, Client } from 'discord.js';
import { Context } from '../service/context';
import { GenericContext } from '../service/generic-context';
import Router from './router';
import { Session } from './session';

export default class Handler {
	@Inject('logger') private logger!: ILogger;

	public constructor(
		private auth: Authentication,
		private router: Router,
		private session: Session,
		private client: Client,
	) {}

	public async onCommand(interaction: CommandInteraction): Promise<void> {

		// Define the context.
		const commandName = interaction.commandName;
		const mapping = this.router.lookupMappingContext('command', commandName);

		// Create a context object.
		const context = new Context(interaction, 'command', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			await interaction.reply(':warning: You are not authorised to do that.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onSubCommand(interaction: CommandInteraction, subcommand: string): Promise<void> {

		// Define the context.
		const commandName = interaction.commandName;
		const mapping = this.router.lookupMappingContext('subcommand', `${commandName}:${subcommand}`);

		// Create a context object.
		const context = new Context(interaction, 'subcommand', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			await interaction.reply(':warning: You are not authorised to do that.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onButton(interaction: ButtonInteraction): Promise<void> {

		// Ignore all internal commands.
		if (interaction.customId.startsWith('internal:')) return;

		// Define the context.
		const [ controller, uniqueName ] = interaction.customId.split(':');
		const mapping = this.router.lookupMappingContext('button', `${controller}:${uniqueName}`);

		// Create a context object.
		const context = new Context(interaction, 'button', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onSelectMenu(interaction: SelectMenuInteraction): Promise<void> {

		// Ignore all internal commands.
		if (interaction.customId.startsWith('internal:')) return;

		// Define the context.
		const [ controller, uniqueName ] = interaction.customId.split(':');
		const mapping = this.router.lookupMappingContext('selectmenu', `${controller}:${uniqueName}`);

		// Create a context object.
		const context = new Context(interaction, 'selectmenu', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onAutocomplete(interaction: AutocompleteInteraction): Promise<void> {

		// Define the context.
		const commandName = interaction.commandName;
		const subCommand = interaction.options.getSubcommand(false);
		const optionObject = interaction.options.getFocused(true);
		const mapping = this.router.lookupMappingContext('autocomplete', `${commandName}:${subCommand ? subCommand + ':' : ''}${optionObject.name}`);

		// Create a context object.
		const context = new Context(interaction, 'autocomplete', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onContextMenu(interaction: ContextMenuInteraction): Promise<void> {

		// Define the context.
		const commandName = interaction.commandName;
		const mapping = this.router.lookupMappingContext('context', commandName);

		// Create a context object.
		const context = new Context(interaction, 'context', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {

		// Ignore all internal commands.
		if (interaction.customId.startsWith('internal:')) return;

		// Define the context.
		const [ controller, uniqueName ] = interaction.customId.split(':');
		const mapping = this.router.lookupMappingContext('modal', `${controller}:${uniqueName}`);

		// Create a context object.
		const context = new Context(interaction, 'modal', this.session);

		// Call on authentication.
		const authSuccess = await this.auth.handle('discord', context, mapping.controller.instance, mapping.methodName);
		if (!authSuccess) {
			this.logger.error('PLUGIN:DISCORD', 'Authentication failed, stopping command.');
			return;
		}

		// Now call the method with the context.
		await mapping.controller.instance[mapping.methodName](context);
	}

	public async onGenericEvent(event: keyof ClientEvents, args: any[]): Promise<void> {

		// Define the context.
		const mappings = this.router.lookupMappingContext('generic', event) as Record<string, any>[];

		// Create a context object.
		const context = new GenericContext(this.client, event, args, this.session);

		// Now call the method with the context.
		mappings.forEach(async mapping => {
			await mapping.controller.instance[mapping.methodName](context);
		});
	}
}
