import { GenerateKey } from '../helper/misc';

export class AbstractCommand {
	private commandKey = GenerateKey(8);

	public getUniqueKey(): string {
		return this.commandKey;
	}
}
