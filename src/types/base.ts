import { IGenericMiddleware } from '@symbux/turbo';
import { Context } from '../service/context';

export interface IMiddleware extends IGenericMiddleware {
	handle: (context: Context) => Promise<boolean>;
}

export interface IOptions {
	bot?: {
		token: string;
		activities?: IActivityItem | IActivityItem[];
		interval?: number;
	}
	oauth?: {
		id: string;
		secret: string;
		scopes: string[];
		baseUrl: string;
	}
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
