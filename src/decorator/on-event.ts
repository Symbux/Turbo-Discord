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
			type: 'command',
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
			type: 'subcommand',
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
			type: 'button',
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
			type: 'selectmenu',
			auth: {},
		});
	};
}

/**
 * Defines a method as a modal submit interaction handler.
 *
 * @param unique The unique key to handle.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function ModalSubmit(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			unique: unique,
			type: 'modal',
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
			type: 'event',
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
 * @param name The name of the option to complete for.
 * @returns MethodDecorator
 * @plugin Turbo-Discord
 */
export function Autocomplete(name: string, subcommand?: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			unique: `${subcommand ? subcommand + ':' : ''}${name}`,
			type: 'autocomplete',
			auth: {},
		});
	};
}
