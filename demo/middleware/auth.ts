import { Middleware, AbstractMiddleware } from '@symbux/turbo';
import { IMiddleware, Context } from '../../src/index';

@Middleware('discord.auth', {}, 'discord')
export default class AuthMiddleware extends AbstractMiddleware implements IMiddleware {
	public async handle(context: Context): Promise<boolean> {
		const member = context.getGuildMember();
		const authObject = {
			id: member.user.id,
			nickname: member.nickname,
			username: member.user.username,
			discriminator: member.user.discriminator,
			roles: member.roles.cache.map(role => role.name),
		};
		context.setAuth(authObject);
		return true;
	}
}
