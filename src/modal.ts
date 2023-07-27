import { App, Modal } from 'obsidian';

function constructModalTitle(title: string) {
	const div = document.createElement('div');
	const h2 = document.createElement('h2');
	const center = document.createElement('center');
	center.appendText(title);
	h2.appendChild(center);
	div.appendChild(h2);
	return div;
}

class MessageModal extends Modal {
  message = '';
  title = '';

	constructor(app: App, { title, message }: any) {
		super(app);
    this.message = message;
		this.title = title || 'A Message from Quail';
	}

	onOpen() {
		const {contentEl} = this;
		const text = this.message.replace(/\n/g, '<br/>');
		const titleEl = constructModalTitle(this.title);
		contentEl.appendChild(titleEl);

		const p = document.createElement('p');
		p.className = 'text-center';
		p.appendText(text);
		contentEl.appendChild(p);
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
		const titleEl = constructModalTitle('Your post has been published!');
		contentEl.appendChild(titleEl);

		const p = document.createElement('p');
		p.className = 'text-center';
		const a = document.createElement('a');
		a.href = this.url;
		a.target = '_blank';
		a.appendText(this.url);
		p.appendChild(a);
		contentEl.appendChild(p);

		const p2 = document.createElement('p');
		p2.className = 'text-center';
		const a2 = document.createElement('a');
		a2.href = this.url;
		a2.target = '_blank';
		const button = document.createElement('button');
		button.appendText('Visit');
		a2.appendChild(button);
		p2.appendChild(a2);
		contentEl.appendChild(p2);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class LoadingModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		const titleEl = constructModalTitle('Loading...');
		contentEl.appendChild(titleEl);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class ErrorModal extends Modal {
	message = '';

	constructor(app: App, error: Error) {
		super(app);

    this.message = error.message;
	}

	onOpen() {
		const {contentEl} = this;
		const titleEl = constructModalTitle('Ooooops, something went wrong');
		contentEl.appendChild(titleEl);

		const p = document.createElement('p');
		p.className = 'text-center';
		p.appendText("Error Message");

		const pre = document.createElement('pre');
		pre.className = 'error-message';

		const code = document.createElement('code');

		code.appendText(this.message);
		pre.appendChild(code);
		p.appendChild(pre);
		contentEl.appendChild(p);
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

export {
	ErrorModal,
  MessageModal,
	PublishResultModal,
	LoadingModal,
}