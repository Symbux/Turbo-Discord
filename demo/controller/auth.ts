import { Http, AbstractController } from '@symbux/turbo';
import { OAuth } from '../../src/index';

@Http.Controller('/auth')
export class AuthController extends AbstractController {

	@Http.Get('/')
	public async index(context: Http.Context): Promise<void> {
		OAuth.DoAuthorisation('/accept', context);
	}

	@Http.Get('/accept')
	public async accept(context: Http.Context): Promise<Http.Response> {

		// Retrieve the token.
		const result = await OAuth.DoToken('/accept', context);
		if (!result || result.status === false) {
			return new Http.Response(200, 'There was a problem getting the token. :(');
		}

		// Now use the token to get user information.
		const user = await OAuth.GetUser(result.access_token);
		if (!user) {
			return new Http.Response(200, 'There was a problem getting the user. :(');
		}

		// Return random stuff.
		return new Http.Response(200, 'Woop!');
	}
}
