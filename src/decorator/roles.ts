import { DecoratorHelper } from '@symbux/turbo';

/**
 * Defines required role(s) needed to run a request.
 *
 * @param roles Array or string of required role(s) to run this command.
 * @returns ClassDecorator
 * @plugin Discord
 */
export function Roles(roles: string | string[]): ClassDecorator {
	return (target: any): void => {
		DecoratorHelper.setClassBase(target, 'controller');
		DecoratorHelper.setMetadata('t:plugin', 'discord', target);
		DecoratorHelper.setMetadata('t:discord:roles', roles, target);
		if (!Reflect.hasMetadata('t:methods', target)) Reflect.defineMetadata('t:methods', [], target);
	};
}
