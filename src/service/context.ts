import { Client, Guild, GuildMember, Interaction, PermissionResolvable, TextChannel, User, Message, MessagePayload, WebhookEditMessageOptions, CommandInteraction } from 'discord.js';
import { Translator } from '@symbux/turbo';
import { Inject } from '@symbux/injector';
import { Session } from '../module/session';
import { ContextActions } from '../context/action';
import { randomBytes } from 'node:crypto';

/**
 * Context class for the Discord plugin.
 *
 * @class Context
 * @plugin Turbo-Discord
 * @injects turbo.translator
 */
export class Context {
	@Inject('turbo.translator') private translator!: Translator;
	private auth: Record<string, any> = {};
	private languages: string[];
	public action: ContextActions;

	/**
	 * Creates instance of context.
	 *
	 * @param interaction The interaction event.
	 * @constructor
	 */
	public constructor(
		private interaction: Interaction,
		public interactionType: string,
		public session: Session,
	) {
		this.languages = ['en-GB', 'en-US'];
		this.action = new ContextActions(this);
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
	 * @returns typeof TextChannel
	 */
	public getChannel(): TextChannel {
		return this.interaction.channel as TextChannel;
	}

	/**
	 * Will defer the reply, so you have more time to respond.
	 */
	public async defer(isEphemeral = true): Promise<void> {
		if (this.interaction.isCommand() || this.interaction.isButton() || this.interaction.isSelectMenu() || this.interaction.isContextMenu() || this.interaction.isMessageComponent()) {
			await this.interaction.deferReply({
				ephemeral: isEphemeral,
			});
		}
	}

	/**
	 * Will defer an update, only usable by buttons, select menus
	 * and message components.
	 */
	public async deferUpdate(): Promise<void> {
		if (this.interaction.isButton() || this.interaction.isSelectMenu() || this.interaction.isMessageComponent()) {
			await this.interaction.deferUpdate();
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
	 * Will respond to an interaction by either replying or editing
	 * the reply if a reply has already been sent.
	 *
	 * @param response Interaction response.
	 */
	public async respond(response: string | MessagePayload | WebhookEditMessageOptions): Promise<void> {
		const interaction = this.getInteraction<CommandInteraction>();
		if (interaction.replied || interaction.deferred) {
			if (typeof response === 'string') {
				await interaction.editReply({
					content: response,
					embeds: [],
					components: [],
				});
			} else {
				await interaction.editReply(response);
			}
		} else {
			await interaction.reply(response);
		}
	}

	/**
	 * Will get the context message for a context menu interaction.
	 *
	 * @returns Message
	 */
	public getContextMessage(): Message | null {
		if (!this.interaction.isContextMenu()) return null;
		if (!this.interaction.isMessageContextMenu()) return null;
		return this.interaction.targetMessage as Message;
	}

	/**
	 * Will get the context author related to the context menu interaction.
	 *
	 * @returns User | null
	 */
	public getContextUser(): User | null {
		if (!this.interaction.isContextMenu()) return null;
		if (this.interaction.isMessageContextMenu()) {
			const targetMessage = this.getContextMessage();
			if (!targetMessage) return null;
			return targetMessage.author;
		} else {
			if (!this.interaction.isUserContextMenu()) return null;
			return this.interaction.targetUser as User;
		}
	}

	/**
	 * Will generate and return a random string.
	 *
	 * @returns string
	 */
	public generateToken(): string {
		return randomBytes(16).toString('hex');
	}
}
