export class Session {
	private sessionData: Record<string, Record<string, any>> = {};

	public set(userId: string, key: string, value: any): void {
		if (!this.sessionData[userId]) this.sessionData[userId] = {};
		this.sessionData[userId][key] = value;
	}

	public get(userId: string, key: string): any {
		if (!this.sessionData[userId]) return null;
		return this.sessionData[userId][key];
	}

	public remove(userId: string, key: string): void {
		if (!this.sessionData[userId]) return;
		delete this.sessionData[userId][key];
	}

	public clear(userId: string): void {
		if (!this.sessionData[userId]) return;
		delete this.sessionData[userId];
	}

	public getAll(userId: string): Record<string, any> {
		if (!this.sessionData[userId]) return {};
		return this.sessionData[userId];
	}
}
