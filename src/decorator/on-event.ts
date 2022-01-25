import { DecoratorHelper } from '@symbux/turbo';
import { ClientEvents } from 'discord.js';

/**
 * Defines a method as a default incoming command.
 *
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Command(): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': false,
			'subcommand': false,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a sub command interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function SubCommand(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'subcommand': true,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a button interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Button(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'subcommand': false,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a select menu interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function SelectMenu(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'subcommand': false,
			'auth': {},
		});
	};
}

/**
 * Defines a method as a generic event handler for the defined
 * event, if none given it will accept all events defined in the
 * controllers event decorator.
 *
 * @param unique Unique event to handle.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Event(event: keyof ClientEvents): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': event,
			'auth': {},
		});
	};
}
