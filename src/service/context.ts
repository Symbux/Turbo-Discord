import {
	Client, CommandInteraction, Guild, GuildMember,
	Interaction, MessageActionRow, MessageButton, MessageEmbed,
	PermissionResolvable, TextBasedChannels, User, Message,
	MessageButtonStyleResolvable, MessageActionRowComponentResolvable,
} from 'discord.js';
import { Translator } from '@symbux/turbo';
import { Inject } from '@symbux/injector';
import { Session } from '../module/session';
import { Queue } from '../module/queue';
import { IConfirmOptions } from '../types/context';
import { Wait } from '../helper/misc';

/**
 * Context class for the Discord plugin.
 *
 * @class Context
 * @plugin Discord
 * @injects turbo.translator
 */
export class Context {
	@Inject('turbo.translator') private translator!: Translator;
	private auth: Record<string, any> = {};
	private languages: string[];

	/**
	 * Creates instance of context.
	 *
	 * @param interaction The interaction event.
	 * @constructor
	 */
	public constructor(
		private interaction: Interaction,
		public interactionType: string,
		public queue: Queue,
		public session: Session,
	) {
		this.languages = ['en-GB', 'en-US'];
	}

	/**
	 * Sets the authentication data for the context, usually called
	 * by the authentication middleware.
	 *
	 * @param auth The auth object.
	 * @returns void
	 * @public
	 */
	public setAuth(auth: Record<string, any>): void {
		this.auth = auth;
	}

	/**
	 * Get's the accepted language for the the interaction.
	 *
	 * @returns string
	 * @public
	 */
	public getLanguages(): string[] {
		return this.languages;
	}

	/**
	 * Will set a higher ranking language.
	 *
	 * @param lang The language.
	 * @returns void
	 */
	public setLanguage(lang: string): void {
		this.languages.unshift(lang);
	}

	/**
	 * Gets the authentication data for the context, usually called
	 * by the authentication checks.
	 *
	 * @returns Record<string, any>
	 * @public
	 */
	public getAuth(): Record<string, any> {
		return this.auth;
	}

	/**
	 * Gets the raw interaction object.
	 *
	 * @returns Interaction
	 * @public
	 */
	public getRaw(): Interaction {
		return this.interaction;
	}

	/**
	 * Will accept the source data and translate it based
	 * on the accepted translations.
	 *
	 * @param source The source content.
	 * @returns string
	 */
	public translate(source: string): string {
		return this.translator.autoTranslate(source, this.languages);
	}

	/**
	 * Will return the user object from the interaction.
	 * @returns User
	 */
	public getUser(): User {
		return this.interaction.user;
	}

	/**
	 * Will return the guild object from the interaction that
	 * the user made the command from.
	 *
	 * @returns Guild
	 */
	public getGuild(): Guild {
		return this.interaction.guild as Guild;
	}

	/**
	 * Will return the guild member object from the interaction.
	 *
	 * @returns GuildMember
	 */
	public getGuildMember(): GuildMember {
		return this.interaction.member as GuildMember;
	}

	/**
	 * Will return the channel the command was executed from.
	 *
	 * @returns TextBasedChannels
	 */
	public getChannel(): TextBasedChannels {
		return this.interaction.channel as TextBasedChannels;
	}

	/**
	 * Will defer the reply, so you have more time to respond.
	 */
	public async defer(isEphemeral = true): Promise<void> {
		if (this.interaction.isCommand() || this.interaction.isButton() || this.interaction.isSelectMenu()) {
			await this.interaction.deferReply({
				ephemeral: isEphemeral,
			});
		}
	}

	/**
	 * Checks whether the interaction user has a single permission or
	 * every permission given in the array.
	 *
	 * @param permissions Single permission or array of permissions.
	 * @returns boolean
	 */
	public hasPermissions(permissions: PermissionResolvable | Array<PermissionResolvable>): boolean {
		const member = this.getGuildMember();
		if (typeof permissions === 'string') return member.permissions.has(permissions);
		return ((permissions as Array<PermissionResolvable>)
			.map(permission => member.permissions.has(permission)) as Array<boolean>)
			.every(v => v === true);
	}

	/**
	 * Checks whether the interaction user has a single role or
	 * every role given in the array.
	 *
	 * @param roles Single role or array of roles.
	 * @returns boolean
	 */
	public hasRoles(roles: string | Array<string>): boolean {
		const member = this.getGuildMember();
		if (typeof roles === 'string') {
			return member.roles.cache.find(role => role.name === roles) !== undefined;
		}
		return (roles
			.map(role => typeof member.roles.cache.find(roleItem => roleItem.name === role) !== 'undefined') as Array<boolean>)
			.every(v => v === true);
	}

	/**
	 * Gets the Discord bot's client.
	 *
	 * @returns Client
	 */
	public getClient(): Client {
		return this.interaction.client;
	}

	/**
	 * Will attempt to find a user by their ID, returning undefined
	 * if not found.
	 *
	 * @param id The ID of the user.
	 * @returns User | undefined
	 */
	public findUserById(id: string): User | undefined {
		return this.getClient().users.cache.get(id);
	}

	/**
	 * Will attempt to find a guild member by their ID, returning
	 * undefined if not found.
	 *
	 * @param id The ID of the guild member.
	 * @returns GuildMember | undefined
	 */
	public findGuildMemberById(id: string): GuildMember | undefined {
		return this.getGuild().members.cache.get(id);
	}

	/**
	 * Will return the interaction with optional generic typing.
	 *
	 * @returns Generic (Interaction | CommandInteraction | ButtonInteraction | SelectMenuInteraction)
	 */
	public getInteraction<T>(): T {
		return this.interaction as any;
	}

	/**
	 * Will create a new confirmation prompt for the user, and then await
	 * the response from the button interaction.
	 *
	 * @param message The message you're asing the user to confirm.
	 * @param options Options to pass to the confirm method.
	 * @returns Promise<boolean>
	 */
	public async confirm(question: string, options?: IConfirmOptions): Promise<boolean | null> {

		// Create a new embed.
		const embed = new MessageEmbed()
			.setTitle('Please confirm...')
			.setDescription(question)
			.setColor('#37ff00');

		// Create the buttons.
		const actionRow = this.createActionRow(
			this.createButton(options?.labels?.accept || 'Yes', 'SUCCESS', 'internal:confirm'),
			this.createButton(options?.labels?.reject || 'No', 'DANGER', 'internal:reject'),
		);

		// Verify the reply has been deferred.
		const interaction = this.getInteraction<CommandInteraction>();
		if (!interaction.deferred) throw new Error('To use the confirm functionality, please defer the reply first.');

		// Send the confirmation.
		const message = await interaction.editReply({
			embeds: [embed],
			components: [actionRow],
		});

		// Create collector and await it.
		const collectedInteraction = await (message as Message).awaitMessageComponent({
			filter: async i => {
				await i.deferUpdate();
				return i.user.id === interaction.user.id;
			},
			componentType: 'BUTTON',
			time: options?.timeout || 5 * 60 * 1000,
		}).catch(() => console.log('No response received.'));

		// If no response, return null (timeout reached).
		if (!collectedInteraction) return null;

		// Should delete response?
		if (!interaction.ephemeral && options?.shouldDelete) {
			(message as Message).delete();
		}

		// Should respond?
		if (options?.respond) {

			// Edit the deferred update.
			await collectedInteraction.editReply({
				content: options.respond.text,
				embeds: [],
				components: [],
			});

			// If not ephemeral, delete the message, after given time.
			if (!interaction.ephemeral) {
				await Wait(options?.respond?.deleteAfter || 5000);
				(message as Message).delete();
			}
		}

		// Check and return result.
		return collectedInteraction.customId === 'internal:confirm';
	}

	/**
	 * Will present the user with a dropdown of choices from here, they can
	 * choose the option that suits them and this will be returned. If the user
	 * fails to reply within the default timeout of 5 minutes, null will be
	 * returned.
	 *
	 * @param question The question to ask the user.
	 * @param options The available options as strings.
	 * @returns The selected option.
	 */
	public async select(question: string, options: string[]): Promise<string | null> {
		console.log(question, options);
		return null;
	}

	/**
	 * Will create an empty action row.
	 *
	 * @returns MessageActionRow
	 */
	public createActionRow(...components: MessageActionRowComponentResolvable[] | MessageActionRowComponentResolvable[][]): MessageActionRow {
		return new MessageActionRow()
			.addComponents(...components);
	}

	/**
	 * Creates a new button for the action row.
	 *
	 * @param label The button label.
	 * @param style The button style.
	 * @param customId A unique ID.
	 * @returns MessageButton
	 */
	public createButton(label: string, style: MessageButtonStyleResolvable, customId: string): MessageButton {
		return new MessageButton()
			.setCustomId(customId)
			.setLabel(label)
			.setStyle(style);
	}
}
