import { Engine, HttpPlugin } from '@symbux/turbo';
import { resolve } from 'path';
import DiscordPlugin, { Intents, ActivityType } from '../src/index';
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
			Intents.DirectMessages,
			Intents.DirectMessageReactions,
			Intents.DirectMessageTyping,
			Intents.Guilds,
			Intents.GuildBans,
			Intents.GuildEmojisAndStickers,
			Intents.GuildIntegrations,
			Intents.GuildMessages,
			Intents.GuildMessageReactions,
			Intents.GuildMessageTyping,
			Intents.GuildPresences,
			Intents.GuildVoiceStates,
			Intents.GuildInvites,
			Intents.GuildWebhooks,
			Intents.GuildScheduledEvents,
			Intents.GuildMembers,
		],
		activities: [
			{
				activities: [
					{ name: 'Symbux', type: ActivityType.Playing },
				],
				status: 'online',
			},
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
