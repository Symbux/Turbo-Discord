import { DecoratorHelper } from '@symbux/turbo';

export function Command(): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': false,
			'auth': {},
		});
	};
}

export function Button(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'auth': {},
		});
	};
}

export function SelectMenu(unique: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			'unique': unique,
			'auth': {},
		});
	};
}
