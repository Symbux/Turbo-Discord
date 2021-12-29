/**
 * A simple wait command to wait a certain amount of time, should be used
 * for testing only.
 *
 * @param ms Number of milliseconds to wait.
 * @returns Promise<void>
 * @export
 * @async
 * @function
 */
export async function Wait(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Will generate a unique key up to 12 characters.
 *
 * @param length The length of the key (max: 12).
 * @returns string
 * @export
 * @function
 */
export function GenerateKey(length: number): string {
	return Math.random().toString(36).substring(2, length + 2);
}
