import { App, Modal } from 'obsidian';

class MessageModal extends Modal {
  message = '';

	constructor(app: App, message: string) {
		super(app);
    this.message = message;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.innerHTML  = this.message.replace(/\n/g, '<br/>');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class PublishResultModal extends Modal {
  url = '';
	client = null;
	listID = '';
	slug = '';

	constructor(app: App,
		client: any,
		listID: string, slug: string,
		url: string
	) {
		super(app);
    this.url = url;
		this.client = client;
		this.listID = listID;
		this.slug = slug;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.innerHTML  = `
			<h2>Your post has been published!</h2>
			<div>
				Please click the link to visit: <a href="${this.url}" target="_blank">${this.url}</a>
			</div>
		`;
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export {
  MessageModal,
	PublishResultModal
}