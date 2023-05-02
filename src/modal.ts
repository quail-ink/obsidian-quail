import { App, Modal } from 'obsidian';

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
		contentEl.innerHTML  = `<div>
	<h2><center>${this.title}</center></h2>
	<p><center>${text}</center></p>
</div>`
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
		contentEl.innerHTML  = `<div>
	<h2><center>Your post has been published!</center></h2>
	<p>
		<center>The post has been published here: <a href="${this.url}" target="_blank">${this.url}</a></center>
	</p>
	<p>
		<center><a href="${this.url}" target="_blank" style="text-decoration: none"><button>Visit</button></a></center>
	</p>
</div>
		`;
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
		contentEl.innerHTML  = '<div><center><h2>Loading...</h2></center></div>'
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
    this.message = `
<p>Error Message</p>
<pre style="margin-bottom: 1rem;"><code style="
	background: rgba(255, 100, 100, 0.2);
	color: #e13838;
	padding: 0.5rem 1rem;
	border-radius: 2px;
	border: 1px solid rgba(255,100,100,0.4);
">${error.message}</code></pre>
`;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.innerHTML  = `<div>
	<h2><center>Ooooops, something went wrong</center></h2>
	<p><center>${this.message}</center></p>
</div>`
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