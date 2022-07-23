import { Command, AbstractCommand, On, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { ButtonStyle } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('actions')
		.setDescription('Choose an action to test.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('confirm')
				.setDescription('Test confirm action.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('choice')
				.setDescription('Test choice action.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('select')
				.setDescription('Test select action.'),
		),
)
export default class ActionCommand extends AbstractCommand {

	@On.SubCommand('confirm')
	public async onConfirm(context: Context): Promise<void> {
		const confirm = await context.action.confirm('Do you agree with this?', {
			ephermeral: false,
			timeout: 10_000,
			description: 'Deserunt in ea veniam nulla elit laboris cupidatat cillum labore sit ea exercitation. Ex eu amet pariatur sit veniam magna tempor et veniam et minim. Culpa consectetur id ullamco et cillum irure id.',
			fields: [
				{ name: 'Test #1', value: 'test1', inline: true },
				{ name: 'Test #2', value: 'test2', inline: true },
				{ name: 'Test #3', value: 'test3', inline: true },
			],
			labels: {
				accept: 'Yes, please',
				reject: 'No, thanks',
			},
		});
		await context.respond(`You have ${confirm ? 'agreed' : 'disagreed'} with this.`);
	}

	@On.SubCommand('choice')
	public async onChoice(context: Context): Promise<void> {
		const choice = await context.action.choice('What is your favorite color?', [
			{ name: 'Red', value: 'red', style: ButtonStyle.Primary },
			{ name: 'Blue', value: 'blue', style: ButtonStyle.Success },
			{ name: 'Green', value: 'green', style: ButtonStyle.Danger },
		], {
			ephermeral: false,
			fields: [
				{ name: 'Test #1', value: 'test1', inline: true },
				{ name: 'Test #2', value: 'test2', inline: true },
				{ name: 'Test #3', value: 'test3', inline: true },
			],
			timeout: 10_000,
			description: 'Occaecat nostrud nisi ullamco ex quis Lorem. Nisi labore dolore occaecat proident ipsum dolor. Irure quis non cillum nulla nisi irure fugiat magna. Sint Lorem duis eiusmod nostrud deserunt exercitation est.',
		});
		await context.respond(`You have chosen ${choice}.`);
	}

	@On.SubCommand('select')
	public async onSelect(context: Context): Promise<void> {
		const selected = await context.action.select('Pick your favourite animal', [
			{ label: 'Cat', value: 'cat' },
			{ label: 'Dog', value: 'dog' },
			{ label: 'Fish', value: 'fish' },
			{ label: 'Lizard', value: 'lizard' },
			{ label: 'Sheep', value: 'sheep' },
			{ label: 'Cow', value: 'cow' },
			{ label: 'Pig', value: 'pig' },
		], {
			ephermeral: false,
			timeout: 10_000,
			minValues: 2,
			maxValues: 2,
			placeholder: 'Please pick two items...',
			description: 'Occaecat nostrud nisi ullamco ex quis Lorem. Nisi labore dolore occaecat proident ipsum dolor. Irure quis non cillum nulla nisi irure fugiat magna. Sint Lorem duis eiusmod nostrud deserunt exercitation est.',
			fields: [
				{ name: 'Test #1', value: 'test1', inline: true },
				{ name: 'Test #2', value: 'test2', inline: true },
				{ name: 'Test #3', value: 'test3', inline: true },
			],
		});
		await context.respond(selected !== null ? `You have selected ${selected.join(', ')}.` : 'You have not selected anything.');
	}
}
