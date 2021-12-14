import Engine, { IPlugin } from '@symbux/turbo';
import { DiscordService } from './service';
import { IOptions } from './types';

export default class Plugin implements IPlugin {
	public name = 'discord';
	public version = '0.1.0';

	public constructor(private options: IOptions) {}

	public install(engine: Engine): void {
		engine.registerSingle(DiscordService, this.options);
	}
}
