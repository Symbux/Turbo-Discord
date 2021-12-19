import { Engine } from '@symbux/turbo';
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

// Register plugin.
engine.use(new DiscordPlugin({
	botToken: String(process.env.BOT_TOKEN),
	clientId: String(process.env.CLIENT_ID),
	clientSecret: String(process.env.CLIENT_SECRET),
	enableOauth: true,
	baseAuthPath: '/discord/auth',
	activityInterval: 5,
	activities: [
		{ type: 'WATCHING', text: 'the server.' },
		{ type: 'WATCHING', text: 'the economy.' },
		{ type: 'WATCHING', text: 'the farms.' },
		{ type: 'WATCHING', text: 'the factions.' },
	],
}));

// Start engine.
engine.start().catch(err => {
	console.error(err);
});
