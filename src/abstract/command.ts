import { GenerateKey } from '../helper/misc';

/**
 * The base class for all commands, this provides the
 * command's uniquely generated key and offers access to it.
 *
 * @class AbstractCommand
 * @plugin Turbo-Discord
 */
export class AbstractCommand {
	private commandKey = GenerateKey(8);

	/**
	 * Will get the command's unique key.
	 *
	 * @returns string
	 */
	public getUniqueKey(): string {
		return this.commandKey;
	}
}
