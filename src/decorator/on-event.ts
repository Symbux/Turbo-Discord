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
			unique: false,
			auth: {},
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
			unique: unique,
			subcommand: true,
			auth: {},
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
			unique: unique,
			auth: {},
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
			unique: unique,
			auth: {},
		});
	};
}

/**
 * Defines a method as a generic event handler for the defined
 * event, if none given it will accept all events defined in the
 * controllers event decorator.
 *
 * @param event Event to listen to.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Event(event: keyof ClientEvents): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			unique: event,
			event: true,
			auth: {},
		});
	};
}

/**
 * Defines a method as a handler for autocomplete functionality,
 * you must provide an open name for the option to handle for,
 * leaving the optionName false will handle all auto-complete
 * methods for all options in the command.
 *
 * @param optionName The name of the option to complete for.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Autocomplete(optionName = '*', subcommand = '*'): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			unique: `${optionName}:${subcommand}`,
			autocomplete: true,
			auth: {},
		});
	};
}
