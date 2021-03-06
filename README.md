<p align="center">
	<a href="#">
		<img width="300" src="https://raw.githubusercontent.com/Symbux/Turbo-Discord/master/logo.svg">
	</a>
</p>

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/Symbux/Turbo-Discord/Build)
![GitHub issues](https://img.shields.io/github/issues/Symbux/Turbo-Discord)
![NPM](https://img.shields.io/npm/l/@symbux/turbo-discord)
![npm (scoped)](https://img.shields.io/npm/v/@symbux/turbo-discord)
![npm](https://img.shields.io/npm/dw/@symbux/turbo-discord)


The Turbo Plugin Discord is an extension to the Turbo engine that offers support for managing and controlling a discord bot, to work inline with the familiar controller structure.

<br>
<br>

<p align="center">
	<a href="https://discord.gg/3YuNTEMJey" target="_blank">
		<img width="200" src="https://discord.com/assets/cb48d2a8d4991281d7a6a95d2f58195e.svg">
		<p align="center">We are on Discord!</p>
	</a>
</p>

<br>

---

<br>

## Installation

With Yarn:
```bash
yarn add @symbux/turbo @symbux/turbo-discord
```

With NPM:
```bash
npm install --save @symbux/turbo @symbux/turbo-discord
```

<br>

---

<br>

## Getting Started

[You can find the documentation here](https://github.com/Symbux/Turbo-Discord/wiki).

```typescript
import { Engine, HttpPlugin } from '@symbux/turbo';
import DiscordPlugin from '@symbux/turbo-discord';

// Initialise engine instance.
const engine = new Engine({
	autowire: true,
});

// Register the http plugin for Discord SSO.
engine.use(new HttpPlugin({
	port: parseInt(String(process.env.PORT)) || 5500,
}));

// Register the discord plugin.
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
engine.start().catch((err) => {
	console.error(err);
});
```

<br>

---

<br>

## Features

* Discord bot slash command support.
* Helper functions for creating intuitive user experiences.
* Embed builder and quick access functionality.
* Built in OAuth functionality for SSO with Discord.
* Support for command option autocomplete using built in class router.
* Support for context menu's in commands and generic context menu classes.
