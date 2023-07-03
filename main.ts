import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { getActions } from './src/action';
import { QuailPluginSettings } from './src/interface';
import { Client } from 'quail-js';

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

		const client = new Client({
			apikey: this.settings.apikey,
			apibase: this.settings.apibase,
			debug: true,
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		const actions = getActions(client, this.app, this.settings);
		for (let ix = 0; ix < actions.length; ix++) {
			const action:any = actions[ix];
			this.addCommand(action)
		}

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
