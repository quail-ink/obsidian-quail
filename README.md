# Obsidian Plugin for [Quail.ink](https://quail.ink)

This is a plugin for [Quail.ink](https://quail.ink).

## Features

- [x] Publish/unpublish notes to Quail.ink
- [x] Deliver published notes to subscribers

## Install manually

Clone the plugin.

```bash
git clone git@github.com:lyricat/obsidian-quail.git
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
