import Engine, { IPlugin } from '@symbux/turbo';
import { DiscordService } from './service/discord';
import { Context } from './service/context';
import { IMiddleware, IOptions, IActivityItem } from './types/base';
import { AbstractCommand } from './abstract/command';
import { Command } from './decorator/command';
import { OAuth } from './module/oauth';
import * as On from './decorator/on-event';

export {
	AbstractCommand,
	Command,
	OAuth,
	On,
	DiscordService,
	IOptions,
	IActivityItem,
	IMiddleware,
	Context,
};

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
