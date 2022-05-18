import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { SelectMenuInteraction } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('select-test')
		.setDescription('Specifically to test select routing.'),
)
export default class SelectTestCommand extends AbstractCommand {

	@On.Command()
	public async onCommand(context: Context): Promise<void> {
		await context.deferUpdate();
		context.respond({
			content: 'Select something.',
			components: [
				context.action.createActionRow(
					context.action.createSelect([
						{ label: 'Option 1', value: 'option1' },
						{ label: 'Option 2', value: 'option2' },
						{ label: 'Option 3', value: 'option3' },
					], 'SelectTestCommand:something-select'),
				),
				context.action.createActionRow(
					context.action.createButton('Select something.', 'PRIMARY', 'SelectTestCommand:something-button'),
				),
			],
		});
	}

	@On.SelectMenu('something-select')
	public async onSelect(context: Context): Promise<void> {
		const interaction = context.getInteraction<SelectMenuInteraction>();
		await context.respond(`You selected: ${interaction.values.join(', ')}`);
	}

	@On.Button('something-button')
	public async onButton(context: Context): Promise<void> {
		const interaction = context.getInteraction<SelectMenuInteraction>();
		await context.respond(`You selected: ${interaction.customId}`);
	}
}
