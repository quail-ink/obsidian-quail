import { App, Editor, MarkdownView, Notice } from 'obsidian';
import { LoadingModal, MessageModal, PublishResultModal } from './modal';
import util from './util';
import { Client } from './api';
import { QuailPluginSettings } from './interface';
import fm from "./frontmatter";

export function getActions(client: any, app: App, settings: QuailPluginSettings) {
  return [
  {
    id: 'quail-publish',
    name: 'Publish',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { title, content, frontmatter, images, err } = await util.getActiveFileContent(app, editor);
      if (err != null) {
        new MessageModal(app, err).open();
        return;
      }

      // upload images and replace
      const oldUrls:string[] = [];
      const newUrls:string[] = [];
      for (let ix = 0; ix < images.length; ix++) {
        const img = images[ix];
        if (img) {
          const resp = await client.uploadAttachment(img);
          oldUrls.push(img.pathname)
          newUrls.push(resp.view_url)
        }
      }

      if (frontmatter?.cover_image) {
        const resp = await client.uploadAttachment(frontmatter?.cover_image);
        frontmatter.cover_image_url = resp.view_url;
      }

      const newContent = util.replaceImageUrls(content, oldUrls, newUrls)

      let resp:any = null;
      try {
        resp = await client.createOrPublish(settings.listID, title, newContent, frontmatter, images)
      } catch (e) {
        const msg = `error: ${e}`;
        new MessageModal(app, msg).open();
        return;
      }

      const slug = resp.slug;
      if (slug) {
        const viewUrl = `${settings.host}/${settings.listID}/p/${slug}`;
        new PublishResultModal(app, client, settings.listID, slug, viewUrl).open();
      } else {
        new MessageModal(app, "resp.slug is empty.").open();
        return;
      }
    }
  },

  {
    id: 'quail-unpublish',
    name: 'Unpublish',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter, err } = await util.getActiveFileContent(app, editor);
      if (err != null) {
        new MessageModal(app, err).open();
        return;
      }

      const client = new Client(settings.apikey, settings.apibase);
      await client.unpublish(settings.listID, frontmatter?.slug)
    }
  },

  {
    id: 'quail-deliver',
    name: 'Deliver',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter, err } = await util.getActiveFileContent(app, editor);
      if (err != null) {
        new MessageModal(app, err).open();
        return;
      }

      const client = new Client(settings.apikey, settings.apibase);
      try {
        await client.deliver(settings.listID, frontmatter?.slug)
      } catch (e) {
        console.log("deliver error: ", e)
        new MessageModal(app, e.toString()).open();
        return;
      }
    }
  },

  {
    id: 'quail-ai-gen-metadata',
    name: 'AI Generate Metadata',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter, content } = util.getActiveFileFrontmatter(app, editor);
      const file = app.workspace.getActiveFile();
      if (file) {
        const modal = new LoadingModal(app)
        const title = file.name.replace(/\.md$/, '');
        if (frontmatter === null || Object.values(frontmatter).length === 0) {
          editor.setCursor({ line: 0, ch: 0 });
          modal.open();
          const fmc = await fm.suggestFrontmatter(client, title, content, [])
          editor.replaceSelection(fmc);
          modal.close();
        } else {
          // @TODO replace frontmatter
          console.log("replace frontmatter: ", frontmatter)
        }
      }
    }
  },

  {
    id: 'quail-insert-metadata',
    name: 'Insert Metadata Template',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter } = util.getActiveFileFrontmatter(app, editor);
      const file = app.workspace.getActiveFile();
      if (file) {
        if (frontmatter === null || Object.values(frontmatter).length === 0) {
          editor.setCursor({ line: 0, ch: 0 });
          const fmc = await fm.emptyFrontmatter()
          editor.replaceSelection(fmc);
        } else {
          // @TODO replace frontmatter
          console.log("replace frontmatter: ", frontmatter)
        }
      }
    }
  },

  ]
}
