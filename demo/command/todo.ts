import { Command, AbstractCommand, On, Add, Context } from '../../src/index';
import { SlashCommandBuilder } from '@discordjs/builders';
import { AutocompleteInteraction, CommandInteraction, ContextMenuInteraction, MessageEmbed } from 'discord.js';

@Command(
	new SlashCommandBuilder()
		.setName('todo')
		.setDescription('Manage your to-do list.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('view')
				.setDescription('View your to-do list.'),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription('Add entry to your to-do list.')
				.addStringOption(option =>
					option
						.setName('task')
						.setDescription('The task to add.')
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription('Remove entry from your to-do list.')
				.addStringOption(option =>
					option
						.setName('task')
						.setDescription('The task to remove.')
						.setAutocomplete(true)
						.setRequired(true),
				),
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('complete')
				.setDescription('Complete entry from your to-do list.')
				.addStringOption(option =>
					option
						.setName('task')
						.setDescription('The task to complete.')
						.setAutocomplete(true)
						.setRequired(true),
				),
		),
)
export default class TodoCommand extends AbstractCommand {
	private tasks: Array<{ id: string, name: string, completed: boolean }> = [
		{ id: '00311c30-559b-49c1-b61b-add106ca539d', name: 'Buy milk', completed: false },
		{ id: '3596cac7-03cd-4c82-9c0c-38f7097110b7',  name: 'Buy eggs', completed: false },
		{ id: '4676b693-9135-40c5-bd51-3fe63156e9f3', name: 'Buy bread', completed: false },
		{ id: '2fd3d428-7d9d-4b9e-ad99-a79b1c4161c0', name: 'Buy cheese', completed: false },
		{ id: 'c6bdf12f-c845-4d91-a91e-974539c02fb1', name: 'Feed cats', completed: false },
		{ id: '1db59a81-a9cf-4331-a805-fc1ba752e80a', name: 'Feed dogs', completed: false },
		{ id: '08353fd1-20f8-45ee-bf97-0d0a17c87354', name: 'Feed birds', completed: false },
		{ id: 'a155d3d1-54e7-4b12-882a-f895ef7bb8aa', name: 'Feed rabbits', completed: false },
		{ id: '60d51dbf-286f-40b7-bb87-26adddf355aa', name: 'Feed horses', completed: false },
	];

	@On.SubCommand('view')
	public async onView(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();

		// Create the embed.
		const embed = new MessageEmbed()
			.setTitle('To-Do List')
			.setDescription(`Here is your to-do list.\n\n${this.tasks.map(task => `${task.completed ? '✅' : '❌'} ${task.name}`).join('\n')}`);

		// Edit the reply.
		await interaction.editReply({
			embeds: [ embed ],
		});
	}

	@On.SubCommand('add')
	public async onAdd(context: Context, name?: string): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();
		const taskName = name || interaction.options.getString('task', true);

		// Confirm intent.
		const shouldContinue = await context.action.confirm(`Add task "${taskName}"?`);
		if (!shouldContinue) {
			await interaction.editReply({
				content: 'Cancelled.',
				embeds: [],
				components: [],
			});
			return;
		}

		// Add the task.
		this.tasks.push({ id: String(new Date().valueOf()), name: taskName, completed: false });
		await interaction.editReply({
			content: `Added task: "${taskName}".`,
			embeds: [],
			components: [],
		});
	}

	@On.SubCommand('remove')
	public async onRemove(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();
		const taskId = interaction.options.getString('task', true);

		// Get the specific task.
		const task = this.tasks.find(task => task.id === taskId);
		if (!task) {
			await interaction.editReply({
				content: 'Task not found.',
				embeds: [],
				components: [],
			});
			return;
		}

		// Confirm intent.
		const shouldContinue = await context.action.confirm(`Remove task "${task.name}"?`);
		if (!shouldContinue) {
			await interaction.editReply({
				content: 'Cancelled task removal.',
				embeds: [],
				components: [],
			});
			return;
		}

		// Remove the task.
		this.tasks = this.tasks.filter(task => task.id !== taskId);

		// Notify completion.
		await interaction.editReply({
			content: `Removed task: "${task.name}".`,
			embeds: [],
			components: [],
		});
	}

	@On.SubCommand('complete')
	public async onComplete(context: Context): Promise<void> {
		await context.defer();
		const interaction = context.getInteraction<CommandInteraction>();
		const taskId = interaction.options.getString('task', true);

		// Get the specific task.
		const task = this.tasks.find(task => task.id === taskId);
		if (!task) {
			await interaction.editReply({
				content: 'Task not found.',
				embeds: [],
				components: [],
			});
			return;
		}

		// Confirm intent.
		const shouldContinue = await context.action.confirm(`Complete task "${task.name}"?`);
		if (!shouldContinue) {
			await interaction.editReply({
				content: 'Cancelled task completion.',
				embeds: [],
				components: [],
			});
			return;
		}

		// Remove the task.
		task.completed = true;

		// Notify completion.
		await interaction.editReply({
			content: `Completed task: "${task.name}".`,
			embeds: [],
			components: [],
		});
	}

	@On.Autocomplete()
	public async onAutocompleteTask(context: Context): Promise<void> {
		const interaction = context.getInteraction<AutocompleteInteraction>();
		const query = interaction.options.getFocused() as string;
		interaction.respond(this.tasks.filter(task => {
			if (!query || String(query).length === 0) return true;
			return task.name.toLowerCase().includes(query.toLowerCase());
		}).map(task => { return { name: task.name, value: task.id }}));
	}

	@Add.MessageContext('Add To-Do')
	public async onAddToDoContextMessage(context: Context): Promise<void> {
		const interaction = context.getInteraction<ContextMenuInteraction>();

		// Check for valid message.
		const message = context.getContextMessage();
		if (!message) {
			await interaction.editReply('No message found.');
			return;
		}

		// Forward command.
		this.onAdd(context, message.content);
	}
}
