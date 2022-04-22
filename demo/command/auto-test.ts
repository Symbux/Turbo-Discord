import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { AutocompleteInteraction } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('auto-test')
		.setDescription('Specifically to test autocomplete functionality.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('names')
				.setDescription('Test autocomplete on names.')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('The name to test.')
						.setAutocomplete(true)
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('ages')
				.setDescription('Test autocomplete on ages.')
				.addStringOption(option =>
					option
						.setName('age')
						.setDescription('The age to test.')
						.setAutocomplete(true)
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('books')
				.setDescription('Test autocomplete on ages.')
				.addStringOption(option =>
					option
						.setName('name')
						.setDescription('The book to test.')
						.setAutocomplete(true)
						.setRequired(true),
				),
		),
)
export default class AutoTestCommand extends AbstractCommand {
	private ages = ['16', '18', '21', '25', '30', '40', '50', '75', '100'];
	private books = ['Harry Potter', 'Eragon', 'The Magicians Guild', 'H.I.V.E', 'Beloved', 'Nineteen Eighty-Four', 'Lord of the Flies', 'The Hunger Games', 'Catch-22'];
	private names = [
		'John', 'Jane', 'Dave', 'Don', 'Alfie', 'Aaron', 'August', 'Bruno', 'Caleb', 'Derek', 'Evan', 'Finn', 'Gabe',
		'Harrison', 'Ian', 'Jackie', 'Kai', 'Liam', 'Mason', 'Nathan', 'Owen', 'Peter', 'Quinn', 'Rory', 'Seth',
	];

	@On.Autocomplete('name', 'names')
	public async onNamesAutoComplete(context: Context): Promise<void> {
		const interaction = context.getInteraction<AutocompleteInteraction>();
		const query = interaction.options.getFocused() as string;
		await interaction.respond(this.baseAutocomplete(this.names, query));
	}

	@On.Autocomplete('age', 'ages')
	public async onAgesAutoComplete(context: Context): Promise<void> {
		const interaction = context.getInteraction<AutocompleteInteraction>();
		const query = interaction.options.getFocused() as string;
		await interaction.respond(this.baseAutocomplete(this.ages, query));
	}

	@On.Autocomplete('name', 'books')
	public async onBooksAutoComplete(context: Context): Promise<void> {
		const interaction = context.getInteraction<AutocompleteInteraction>();
		const query = interaction.options.getFocused() as string;
		await interaction.respond(this.baseAutocomplete(this.books, query));
	}

	private baseAutocomplete(data: string[], query: string): Array<{ name: string, value: string }> {

		// If no query or empty query, return all data.
		if (!query || String(query).length === 0) {
			return data.map(item => { return { name: item, value: item }});
		}

		// Has query, filter on that data.
		return data
			.filter(item => item.toLowerCase().includes(query.toLowerCase()))
			.map(item => { return { name: item, value: item }});
	}
}
