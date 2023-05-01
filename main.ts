import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { MessageModal, PublishResultModal } from './src/modal';
import util from './src/util';
import { getActions } from './src/action';
import { Client } from './src/api';

interface QuailPluginSettings {
	apikey: string;
	apibase: string;
	host: string;
	listID: string;
}

const DEFAULT_SETTINGS: QuailPluginSettings = {
	apikey: '',
	apibase: 'https://api.quail.ink',
	host: 'https://quail.ink',
	listID: '',
}

export default class QuailPlugin extends Plugin {
	settings: QuailPluginSettings;

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		const actions = getActions(this.app, this.settings);
		for (let ix = 0; ix < actions.length; ix++) {
			const action = actions[ix];
			this.addCommand(action)
		}
		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'quail-publish',
		// 	name: 'Publish at Quail.ink',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		const { title, content, frontmatter, images, err } = await util.getActiveFileContent(app, editor);
		// 		if (err != null) {
		// 			new MessageModal(this.app, err).open();
		// 			return;
		// 		}

		// 		const client = new Client(this.settings.apikey, this.settings.apibase);

		// 		let resp = null;
		// 		try {
		// 			resp = await client.createOrPublish(this.settings.listID, title, content, frontmatter, images)
		// 		} catch (e) {
		// 			const msg = `error: ${e}`;
		// 			new MessageModal(this.app, msg).open();
		// 			return;
		// 		}

		// 		const slug = resp.slug;
		// 		if (slug) {
		// 			const viewUrl = `${this.settings.host}/${this.settings.listID}/p/${slug}`;
		// 			new PublishResultModal(this.app, client, this.settings.listID, slug, viewUrl).open();
		// 		} else {
		// 			new MessageModal(this.app, "resp.slug is empty.").open();
		// 			return;
		// 		}
		// 	}
		// });

		// this.addCommand({
		// 	id: 'quail-unpublish',
		// 	name: 'Unpublish from Quail.ink',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		const { frontmatter, err } = await util.getActiveFileContent(app, editor);
		// 		if (err != null) {
		// 			new MessageModal(this.app, err).open();
		// 			return;
		// 		}

		// 		const client = new Client(this.settings.apikey, this.settings.apibase);
		// 		await client.unpublish(this.settings.listID, frontmatter?.slug)
		// 	}
		// });

		// this.addCommand({
		// 	id: 'quail-deliver',
		// 	name: 'Deliver via Quail.ink',
		// 	editorCallback: async (editor: Editor, view: MarkdownView) => {
		// 		const { frontmatter, err } = await util.getActiveFileContent(app, editor);
		// 		if (err != null) {
		// 			new MessageModal(this.app, err).open();
		// 			return;
		// 		}

		// 		const client = new Client(this.settings.apikey, this.settings.apibase);
		// 		try {
		// 			await client.deliver(this.settings.listID, frontmatter?.slug)
		// 		} catch (e) {
		// 			console.log("deliver error: ", e)
		// 			new MessageModal(this.app, e.toString()).open();
		// 			return;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new QuailSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class QuailSettingTab extends PluginSettingTab {
	plugin: QuailPlugin;

	constructor(app: App, plugin: QuailPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for plugin of Quail.ink.'});

		new Setting(containerEl)
			.setName('Quail API Key')
			.setDesc('Please grab your API key from https://quail.ink')
			.addText(text => text
				.setPlaceholder('Enter API Key')
				.setValue(this.plugin.settings.apikey)
				.onChange(async (value) => {
					this.plugin.settings.apikey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
		.setName('List ID or slug')
		.setDesc('Your list ID or slug. You can find it in the URL of your list page. For example, if your list URL is https://quail.ink/my-list, your list ID or slug is "my-list".')
		.addText(text => text
			.setPlaceholder('Enter List ID or slug')
			.setValue(this.plugin.settings.listID)
			.onChange(async (value) => {
				this.plugin.settings.listID = value;
				await this.plugin.saveSettings();
			}));
		containerEl.createEl('h2', {text: 'Advanced Settings'});
		new Setting(containerEl)
			.setName('Quail API Base')
			.setDesc('You can change the base URL if you are using a self-hosted version of Quail')
			.addText(text => text
				.setPlaceholder('Enter API Base')
				.setValue(this.plugin.settings.apibase)
				.onChange(async (value) => {
					this.plugin.settings.apibase = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Quail Host')
			.setDesc('You can change the host URL if you are using a self-hosted version of Quail')
			.addText(text => text
				.setPlaceholder('Enter Host')
				.setValue(this.plugin.settings.host)
				.onChange(async (value) => {
					this.plugin.settings.host = value;
					await this.plugin.saveSettings();
				}));
	}
}
