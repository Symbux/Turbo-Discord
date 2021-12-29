
/**
 * Session class for storing session data.
 *
 * @class Session
 * @plugin Discord
 */
export class Session {
	private sessionData: Record<string, Record<string, any>> = {};

	/**
	 * Will set data to the user's session.
	 *
	 * @param userId The user's unique ID.
	 * @param key The key to store the data under.
	 * @param value The value to store.
	 */
	public set(userId: string, key: string, value: any): void {
		if (!this.sessionData[userId]) this.sessionData[userId] = {};
		this.sessionData[userId][key] = value;
	}

	/**
	 * Will get data from the user's session.
	 *
	 * @param userId The user's unique ID.
	 * @param key The key to get the data from.
	 */
	public get(userId: string, key: string): any {
		if (!this.sessionData[userId]) return null;
		return this.sessionData[userId][key];
	}

	/**
	 * Will remove data from the user's session.
	 *
	 * @param userId The user's unique ID.
	 * @param key The key to remove the data from.
	 */
	public remove(userId: string, key: string): void {
		if (!this.sessionData[userId]) return;
		delete this.sessionData[userId][key];
	}

	/**
	 * Will delete all user's session data.
	 *
	 * @param userId The user's unique ID.
	 */
	public clear(userId: string): void {
		if (!this.sessionData[userId]) return;
		delete this.sessionData[userId];
	}

	/**
	 * Will get all data from a user's session.
	 *
	 * @param userId The user's unique ID.
	 */
	public getAll(userId: string): Record<string, any> {
		if (!this.sessionData[userId]) return {};
		return this.sessionData[userId];
	}
}
