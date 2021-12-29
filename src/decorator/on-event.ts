import { DecoratorHelper } from '@symbux/turbo';

/**
 * Defines a method as a default incoming command.
 *
 * @returns MethodDecorator
 * @plugin Discord
 */
export function Command(): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': false,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a button interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Discord
 */
export function Button(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a select menu interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Discord
 */
export function SelectMenu(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'auth': {},
		});
	};
}
