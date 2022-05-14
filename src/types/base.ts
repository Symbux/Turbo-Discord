import { IGenericMiddleware } from '@symbux/turbo';
import { Context } from '../service/context';
import { BitFieldResolvable, IntentsString, ClientEvents } from 'discord.js';
import { GenericContext } from '../service/generic-context';

export interface IMiddleware extends IGenericMiddleware {
	handle: (context: Context) => Promise<boolean>;
}

export interface IEventMiddleware extends IGenericMiddleware {
	handle: (context: GenericContext) => Promise<boolean>;
}

export interface IOptions {
	bot?: {
		token: string;
		activities?: IActivityItem | IActivityItem[];
		interval?: number;
		intents?: BitFieldResolvable<IntentsString, number>;
		events?: Array<keyof ClientEvents>;
		unregisterCommands?: boolean;
	};
	oauth?: {
		id: string;
		secret: string;
		scopes: string[];
		baseUrl: string;
	};
}

export interface IActivityItem {
	type: 'PLAYING' | 'STREAMING' | 'LISTENING' | 'WATCHING' | 'COMPETING';
	text: string;
	url?: string;
	shardId?: number | number[];
}

export interface IQueueItem {
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
	userId?: string;
}

export interface IQueueItemExtended extends IQueueItem {
	created: number;
}
