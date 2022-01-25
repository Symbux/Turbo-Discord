import { DecoratorHelper } from '@symbux/turbo';
import { SlashCommandBuilder } from '@discordjs/builders';

/**
 * Defines a class (controller) as a Discord command.
 *
 * @param command An instance of the slash command builder.
 * @returns ClassDecorator
 * @plugin Turbo-Discord
 */
export function Command(command: Omit<SlashCommandBuilder, any>): ClassDecorator {
	return (target: any): void => {
		DecoratorHelper.setClassBase(target, 'controller');
		DecoratorHelper.setMetadata('t:plugin', 'discord', target);
		DecoratorHelper.setMetadata('t:discord:type', 'command', target);
		DecoratorHelper.setMetadata('t:discord:command', command, target);
		if (!Reflect.hasMetadata('t:methods', target)) Reflect.defineMetadata('t:methods', [], target);
	};
}
