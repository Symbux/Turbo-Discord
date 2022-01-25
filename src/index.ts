import Engine, { IPlugin } from '@symbux/turbo';
import { DiscordService } from './service/discord';
import { Context } from './service/context';
import { GenericContext } from './service/generic-context';
import { IMiddleware, IOptions, IActivityItem, IEventMiddleware, IQueueItem, IQueueItemExtended } from './types/base';
import { IConfirmOptions } from './types/context';
import { AbstractCommand } from './abstract/command';
import { AbstractEvent } from './abstract/event';
import { Command } from './decorator/command';
import { Event } from './decorator/event';
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
	AbstractEvent,
	Command,
	Event,
	OAuth,
	Queue,
	Session,
	On,
	DiscordService,
	IOptions, IActivityItem, IMiddleware, IEventMiddleware, IQueueItem, IQueueItemExtended,
	IConfirmOptions,
	Context,
	GenericContext,
	Misc,
	Intents,
};

/**
 * The Discord plugin for the Turbo engine.
 * Comes with a bot and command structure following standard turbo engine
 * controllers, alongside an OAuth2 helper for managing authentication.
 *
 * @plugin Turbo-Discord
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
