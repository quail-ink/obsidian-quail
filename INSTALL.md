# Installation

Quail's Obsidian plugin can be found in the Obsidian community plugin list. You can install it directly from there.

1. Open Obsidian's settings page and click on the "Community Plugins" tab.
2. Click the "Browse" button at the right of the "Community Plugins" tab. A plugin list will appear.
3. Search for "Quail" in the plugin list and click the "Install" button.

## Other installation methods

If you want to try other versions of the plugin, or want to 

**Installing with obsidian42-brat plugin**

[obsidian42-brat](https://github.com/TfTHacker/obsidian42-brat) is an Obsidian plugin that can be used to install and test other plugins that haven't made it to the marketplace. Therefore, you can first install the obsidian42-brat plugin and then use it to install Quail's Obsidian plugin.

1. Install the obsidian42-brat plugin:
   In Obsidian's settings, click on the "Community Plugins" tab, then click the "Install Plugins" button, search for "obsidian42-brat," and click the "Install" button. Once installed, enable the plugin.
2. Add Quail to the list of plugins in the obsidian42-brat plugin:
   In the settings of Obsidian42-brat, click "Add Beta Plugin," input `https://github.com/quail-ink/obsidian-quail`, and click the "Add" button.
3. You can check the "Auto-update plugins at startup" option, so that the Obsidian42-brat plugin will automatically update Quail's plugin upon startup.

**Manual Installation**

1. Download the latest version of the plugin from the [GitHub release page](https://github.com/quail-ink/obsidian-quail/releases/)
2. Unzip the downloaded file and you will see there is a "obsidian-quail" folder.
3. Go to Obsidian's settings page and click on the "Community Plugins" tab. 
4. Click the "Folder" button at the right of the "Community Plugins" tab. A file view will appear. Copy the "obsidian-quail" folder into the file view.
5. Restart Obsidian
6. Go to "Community Plugins" tab and find the Quail plugin and click the "Enable" button.

**Installing from source**

Clone the plugin.

```bash
git clone https://github.com/quail-ink/obsidian-quail.git
cd obsidian-quail
```

Build the plugin.

```bash
npm install
npm run build
```

Copy the plugin to your vault.

```
mkdir $VAULT_PATH/.obsidian/plugins/obsidian-quail
mv main.js styles.css manifest.json $VAULT_PATH/.obsidian/plugins/obsidian-quail
```
