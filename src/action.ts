import { App, Editor, MarkdownView, Notice } from 'obsidian';
import { MessageModal, PublishResultModal } from './modal';
import util from './util';
import { Client } from './api';
import { QuailPluginSettings } from './interface';
import dayjs from "dayjs";

export function getActions(app: App, settings: QuailPluginSettings) {
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

      const client = new Client(settings.apikey, settings.apibase);

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
    id: 'quail-insert-frontmatter',
    name: 'Insert Frontmatter',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const now = dayjs();
      editor.replaceSelection(`---
slug: YOUR_NOTE_SLUG
summary: YOUR_NOTE_SUMMARY
tags: YOUR_NOTE_TAGS
cover_image_url: YOUR_NOTE_COVER_IMAGE_URL
date: ${now.format('YYYY-MM-DD HH:mm')}
---`);
    }
  }
  ]
};