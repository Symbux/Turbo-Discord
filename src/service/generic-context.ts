import { Client, ClientEvents } from 'discord.js';
import { Translator } from '@symbux/turbo';
import { Inject } from '@symbux/injector';
import { Session } from '../module/session';
import { Queue } from '../module/queue';

/**
 * Context class for the Discord plugin.
 *
 * @class Context
 * @plugin Turbo-Discord
 * @injects turbo.translator
 */
export class GenericContext {
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
		private client: Client,
		public eventType: string,
		public args: any[],
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
	 * Gets the raw object.
	 *
	 * @returns Interaction
	 * @public
	 */
	public getRaw(): { event: string, args: any[] } {
		return {
			event: this.eventType,
			args: this.args,
		};
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
	 * Gets the Discord bot's client.
	 *
	 * @returns Client
	 */
	public getClient(): Client {
		return this.client;
	}

	/**
	 * Returns the event type.
	 *
	 * @returns keyof ClientEvents (string)
	 */
	public getEventName(): keyof ClientEvents {
		return this.eventType as keyof ClientEvents;
	}

	/**
	 * Returns the given arguments to an event.
	 *
	 * @returns any[]
	 */
	public getArguments(): any[] {
		return this.args;
	}
}
