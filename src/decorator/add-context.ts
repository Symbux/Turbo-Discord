import { DecoratorHelper } from '@symbux/turbo';

export function MessageContext(name: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			basetype: 'Context',
			subtype: 'Message',
			name: name,
			auth: {},
		});
	};
}

export function UserContext(name: string): MethodDecorator {
	return (target: any, propertyKey: symbol | string): void => {
		DecoratorHelper.addMethod(target, propertyKey, {
			basetype: 'Context',
			subtype: 'User',
			name: name,
			auth: {},
		});
	};
}
