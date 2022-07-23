import { IGenericMiddleware } from '@symbux/turbo';
import { Context } from '../service/context';
import { BitFieldResolvable, GatewayIntentsString, PresenceData, ClientEvents } from 'discord.js';
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
		activities?: PresenceData | PresenceData[];
		interval?: number;
		intents?: BitFieldResolvable<GatewayIntentsString, number>;
		events?: Array<keyof ClientEvents>;
		commands?: {
			disableRegister?: boolean;
			disableUnregister?: boolean;
		};
	};
	oauth?: {
		id: string;
		secret: string;
		scopes: string[];
		baseUrl: string;
	};
}

export interface IQueueItem {
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
	userId?: string;
}

export interface IQueueItemExtended extends IQueueItem {
	created: number;
}
