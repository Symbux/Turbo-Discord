import { Http, ILogger } from '@symbux/turbo';
import { Inject } from '@symbux/injector';
import { IOptions } from '../types/base';
import fetch from 'cross-fetch';

/**
 * The OAuth class can be called upon to run Discord SSO (OAuth2)
 * functionality for a user's login and return data for you to process.
 *
 * @class OAuth
 * @plugin Discord
 * @injects logger
 */
export class OAuth {

	@Inject('logger') private static logger: ILogger;
	private static options: IOptions;
	private static redirectPath: string;

	public static setOptions(options: IOptions): void {
		if (options.oauth && options.oauth.secret && options.oauth.scopes && options.oauth.baseUrl && options.oauth.id) {
			this.options = options;
		} else {
			throw new Error('Discord OAuth options are not valid / complete.');
		}
	}

	public static DoAuthorisation(redirectPath: string, context: Http.Context): void {

		// Check the options.
		if (!this.hasValidOptions()) {
			throw new Error('Discord OAuth options are not valid / complete.');
		}

		// Get the response.
		const response = context.getResponse();
		this.redirectPath = redirectPath;

		// Redirect to discord for authorisation.
		response.redirect(this.getUrl({
			client_id: String(this.options.oauth?.id),
			redirect_uri: `${this.options.oauth?.baseUrl}${redirectPath}`,
			response_type: 'code',
			scope: (this.options.oauth?.scopes as string[]).join(' '),
		}));
	}

	/**
	 *
	 * @param redirectPath The path to redirect to.
	 * @param context
	 * @returns
	 */
	public static async DoAccept(context: Http.Context): Promise<Record<string, any> | null> {

		// Check the options.
		if (!this.hasValidOptions()) {
			throw new Error('Discord OAuth options are not valid / complete.');
		}

		// Get the query data.
		const query = context.getQuery();

		// If error, log it and return error information.
		if (query.error) {
			this.logger.error('PLUGIN:DISCORD', `Failed to accept authorisation response: ${query.error}`, new Error(query.error));
			return { status: false, error: query.error, reason: query.error_description };
		}

		// Accept the payload and formulate fetch request.
		const payload = new URLSearchParams();
		payload.append('client_id', String(this.options.oauth?.id));
		payload.append('client_secret', (this.options.oauth?.secret as string));
		payload.append('grant_type', 'authorization_code');
		payload.append('code', query.code);
		payload.append('redirect_uri', `${this.options.oauth?.baseUrl}${this.redirectPath}`);
		payload.append('scope', (this.options.oauth?.scopes as string[]).join(' '));

		// Send the token request.
		const authResponse = await fetch('https://discord.com/api/oauth2/token', {
			method: 'POST',
			body: payload,
			headers: {
				Authorization: `Basic ${Buffer.from(`${this.options.oauth?.id}:${this.options.oauth?.secret}`).toString('base64')}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		// If authorisation failed, return error and log it.
		if (authResponse.status !== 200) {
			this.logger.error('PLUGIN:DISCORD', `Failed to accept token response: ${authResponse.status}`, new Error(authResponse.statusText));
			return { status: false, error: authResponse.statusText, reason: authResponse.status };
		}

		// Return the token information.
		const authData = (await authResponse.json() as Record<string, string>);
		return { status: true, ...authData };
	}

	/**
	 * Get the user information, based on the scopes given.
	 *
	 * @param token The user's token.
	 * @returns Record<string, any>
	 */
	public static async GetUser(token: string): Promise<Record<string, any> | null> {

		// Check the options.
		if (!this.hasValidOptions()) {
			throw new Error('Discord OAuth options are not valid / complete.');
		}

		// Make the request.
		const response =  await fetch('https://discord.com/api/users/@me', {
			headers: { Authorization: `Bearer ${token}` },
		});

		// Check for valid response.
		if (response.status !== 200) {
			this.logger.error('PLUGIN:DISCORD', `Failed to get user information: ${response.status}`, new Error(response.statusText));
			return null;
		}

		// Return the data.
		return await response.json();
	}

	/**
	 * Will return the fetch response, is used for simple GET methods.
	 *
	 * @param token The user's token.
	 * @param apiPath The API path to fetch.
	 * @returns Promise<Response>
	 */
	public static async DoFetch(token: string, apiPath: string): Promise<Response> {

		// Check the options.
		if (!this.hasValidOptions()) {
			throw new Error('Discord OAuth options are not valid / complete.');
		}

		// Make the request.
		return await fetch(`https://discord.com/api/${apiPath}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
	}

	/**
	 * Returns the headers, with that token defined ready for being used
	 * with the `GetFetch` function.
	 *
	 * @param token The user's token.
	 * @returns Record<string, string>
	 */
	public static GetHeaders(token: string): Record<string, string> {
		return { Authorization: `Bearer ${token}` };
	}

	/**
	 * Will return the fetch function to be called on as needed.
	 *
	 * @returns typeof fetch
	 * @static
	 */
	public static GetFetch(): typeof fetch {
		return fetch;
	}

	/**
	 * Will accept an object of options and return a URL string with the options
	 * added as query parameters.
	 *
	 * @param options Object of options to append.
	 * @returns string
	 */
	private static getUrl(options: Record<string, string>): string {
		const baseUrl = 'https://discord.com/oauth2/authorize?';
		return baseUrl + Object.entries(options).map(([key, value]) => `${key}=${value}`).join('&');
	}

	private static hasValidOptions(): boolean {
		if (
			this.options.oauth &&
			this.options.oauth.secret &&
			this.options.oauth.scopes &&
			this.options.oauth.baseUrl &&
			this.options.oauth.id
		) {
			return true;
		} else {
			return false;
		}
	}
}
