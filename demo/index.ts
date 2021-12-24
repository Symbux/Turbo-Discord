import { Engine, HttpPlugin } from '@symbux/turbo';
import { resolve } from 'path';
import DiscordPlugin from '../src/index';
import { config as configureDotenv } from 'dotenv';

// Prepare dotenv.
configureDotenv();

// Initialise engine.
const engine = new Engine({
	autowire: true,
	logLevels: ['info', 'warn', 'error', 'verbose', 'debug'],
	basepath: {
		source: resolve(process.cwd(), './demo'),
		compiled: resolve(process.cwd(), './demo'),
	},
});

// Register the http plugin.
engine.use(new HttpPlugin({
	port: 5500,
}));

// Register plugin.
engine.use(new DiscordPlugin({
	bot: {
		token: String(process.env.BOT_TOKEN),
		interval: 5,
		activities: [
			{ type: 'WATCHING', text: 'the server.' },
			{ type: 'WATCHING', text: 'the economy.' },
			{ type: 'WATCHING', text: 'the farms.' },
			{ type: 'WATCHING', text: 'the factions.' },
		],
	},
	oauth: {
		id: String(process.env.CLIENT_ID),
		baseUrl: 'http://localhost:5500/auth',
		scopes: ['identify', 'guilds', 'email', 'connections'],
		secret: String(process.env.CLIENT_SECRET),
	},
}));

// Start engine.
engine.start().catch(err => {
	console.error(err);
});
