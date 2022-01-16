import Engine, { IPlugin } from '@symbux/turbo';
import { DiscordService } from './service/discord';
import { Context } from './service/context';
import { IMiddleware, IOptions, IActivityItem } from './types/base';
import { IConfirmOptions } from './types/context';
import { AbstractCommand } from './abstract/command';
import { Command } from './decorator/command';
import { Queue } from './module/queue';
import { Session } from './module/session';
import { OAuth } from './module/oauth';
import { Intents } from 'discord.js';
import * as On from './decorator/on-event';
import * as Misc from './helper/misc';

/**
 * The Discord plugin.
 * All exports for the discord plugin.
 */
export {
	AbstractCommand,
	Command,
	OAuth,
	Queue,
	Session,
	On,
	DiscordService,
	IOptions, IActivityItem, IMiddleware,
	IConfirmOptions,
	Context,
	Misc,
	Intents,
};

/**
 * The Discord plugin for the Turbo engine.
 * Comes with a bot and command structure following standard turbo engine
 * controllers, alongside an OAuth2 helper for managing authentication.
 *
 * @plugin Discord
 */
export default class Plugin implements IPlugin {
	public name = 'discord';
	public version = '0.1.0';

	public constructor(private options: IOptions) {
		OAuth.setOptions(options);
	}

	public install(engine: Engine): void {

		// Register the discord service.
		engine.registerSingle(DiscordService, this.options);
	}
}
