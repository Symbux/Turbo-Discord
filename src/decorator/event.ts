import { DecoratorHelper } from '@symbux/turbo';

/**
 * Defines a class (controller) as a Discord generic event handler.
 *
 * @returns ClassDecorator
 * @plugin Turbo-Discord
 */
export function Event(): ClassDecorator {
	return (target: any): void => {
		DecoratorHelper.setClassBase(target, 'controller');
		DecoratorHelper.setMetadata('t:plugin', 'discord', target);
		DecoratorHelper.setMetadata('t:discord:type', 'generic', target);
		if (!Reflect.hasMetadata('t:methods', target)) Reflect.defineMetadata('t:methods', [], target);
	};
}
