import { DecoratorHelper } from '@symbux/turbo';

/**
 * Defines required permission(s) needed to run a request.
 *
 * @param permissions Array or string of required permission(s) to run this command.
 * @returns ClassDecorator
 * @plugin Discord
 */
export function Permissions(permissions: string | string[]): ClassDecorator {
	return (target: any): void => {
		DecoratorHelper.setClassBase(target, 'controller');
		DecoratorHelper.setMetadata('t:plugin', 'discord', target);
		DecoratorHelper.setMetadata('t:discord:permissions', permissions, target);
		if (!Reflect.hasMetadata('t:methods', target)) Reflect.defineMetadata('t:methods', [], target);
	};
}
