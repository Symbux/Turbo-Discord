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
			],
		});
	}

	@On.SelectMenu('something-select')
	public async onSelect(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<SelectMenuInteraction>();
		const channel = context.getChannel();
		await channel.send(`You selected: ${interaction.values.join(', ')}`);
	}
}
