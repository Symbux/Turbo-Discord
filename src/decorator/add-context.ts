import { DecoratorHelper } from '@symbux/turbo';

export function MessageContext(name: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			type: 'context',
			subtype: 'Message',
			name: name,
			auth: {},
		});
	};
}

export function UserContext(name: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			type: 'context',
			subtype: 'User',
			name: name,
			auth: {},
		});
	};
}
