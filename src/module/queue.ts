import { IQueueItem, IQueueItemExtended } from '../types/base';

/**
 * The queue class allows you to save promises with unique information to them,
 * so that later you can pick them up and resolve them.
 *
 * @class Queue
 * @plugin Discord
 */
export class Queue {

	private interval: NodeJS.Timeout | null = null;
	private queue: Map<string, IQueueItemExtended> = new Map();

	public constructor() {
		this.interval = setInterval(() => {
			this.processQueue();
		}, 1000 * 60);
	}

	public get(uniqueId: string, userId: string): IQueueItemExtended | null {
		const item = this.queue.get(uniqueId);
		if (!item) return null;
		if (item.userId && item.userId !== userId) return null;
		return item;
	}

	public set(uniqueId: string, item: IQueueItem): void {
		this.queue.set(uniqueId, {
			...item,
			created: Date.now(),
		});
	}

	public processQueue(): void {
		if (this.queue.size === 0) return;
		const now = Date.now();
		for (const [uniqueId, item] of this.queue) {
			if (now - item.created > 1000 * 60 * 5) {
				this.queue.delete(uniqueId);
				item.reject(new Error('Timeout'));
			}
		}
	}
}
