import { Engine, HttpPlugin } from '@symbux/turbo';
import { resolve } from 'path';
import DiscordPlugin, { Intents } from '../src/index';
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
		commands: {
			disableRegister: false,
			disableUnregister: true,
		},
		token: String(process.env.BOT_TOKEN),
		interval: 5,
		events: ['messageCreate'],
		intents: [
			Intents.FLAGS.DIRECT_MESSAGES,
			Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
			Intents.FLAGS.DIRECT_MESSAGE_TYPING,
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_BANS,
			Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
			Intents.FLAGS.GUILD_INTEGRATIONS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
			Intents.FLAGS.GUILD_MESSAGE_TYPING,
			Intents.FLAGS.GUILD_PRESENCES,
			Intents.FLAGS.GUILD_VOICE_STATES,
			Intents.FLAGS.GUILD_INVITES,
			Intents.FLAGS.GUILD_WEBHOOKS,
			Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
			Intents.FLAGS.GUILD_MEMBERS,
		],
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
