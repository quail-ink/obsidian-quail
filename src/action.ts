import { App, Editor, MarkdownView, Notice } from 'obsidian';
import { LoadingModal, MessageModal, ErrorModal, PublishResultModal } from './modal';
import util from './util';
import { QuailPluginSettings } from './interface';
import fm from "./frontmatter";

async function arrangeArticle(app: App, editor: Editor, client: any, settings: QuailPluginSettings) {
  const { title, content, frontmatter, images, err } = await util.getActiveFileContent(app, editor);
  if (err != null) {
    new MessageModal(app, { message: err.toString() }).open();
    return { frontmatter: null, content: null};
  }

  const { verified, reason } = fm.verifyFrontmatter(frontmatter)
  if (!verified) {
    new MessageModal(app, {title: "Failed to verify the metadata",  message: reason }).open();
    return { frontmatter: null, content: null};
  }

  // upload images
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

  // upload cover image
  if (frontmatter?.cover_image) {
    const resp = await client.uploadAttachment(frontmatter?.cover_image);
    frontmatter.cover_image_url = resp.view_url;
  }

  // replace image urls
  const newContent = util.replaceImageUrls(content, oldUrls, newUrls).trim() || '';
  const fmt = fm.formalizeFrontmatter(frontmatter, newContent);

  return {
    title: title,
    frontmatter: fmt,
    content: newContent,
  }
}

export async function savePost(app: App, editor: Editor, client: any, settings: QuailPluginSettings) {
  const { title, frontmatter, content } = await arrangeArticle(app, editor, client, settings);

  const payload = {
    slug: frontmatter.slug,
    title: frontmatter.title || title,
    cover_image_url: frontmatter.cover_image_url,
    summary: frontmatter.summary,
    content: content,
    tags: frontmatter.tags,
  }

  let resp:any = null;
  try {
    resp = await client.createPost(settings.listID, payload);
  } catch (e) {
    new ErrorModal(app, e).open();
    return;
  } finally {
    //
  }

  return resp;
}

export function getActions(client: any, app: App, settings: QuailPluginSettings) {
  return [
  {
    id: 'quail-publish',
    name: 'Publish',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      let pt:any = null;
      try {
        pt = await savePost(app, editor, client, settings);
      } catch (e) {
        new ErrorModal(app, e).open();
        loadingModal.close();
        return;
      }

      try {
        pt = await client.publishPost(settings.listID, pt.slug);
      } catch (e) {
        new ErrorModal(app, e).open();
        loadingModal.close();
        return;
      } finally {
        loadingModal.close();
      }

      const slug = pt.slug || '';
      if (slug) {
        const viewUrl = `${settings.host}/${settings.listID}/p/${slug}`;
        new PublishResultModal(app, client, settings.listID, slug, viewUrl).open();
      } else {
        new MessageModal(app, { message: "resp.slug is empty." }).open();
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
        new ErrorModal(app, new Error(err)).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.unpublishPost(settings.listID, frontmatter?.slug);
        new MessageModal(app, {
          title: "Unpublish",
          message: "This post has removed from published list."
        }).open();
      } catch (e) {
        loadingModal.close();
        new ErrorModal(app, e).open();
      } finally {
        loadingModal.close();
      }
    }
  },

  {
    id: 'quail-save',
    name: 'Save',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      let pt:any = null;
      try {
        pt = await savePost(app, editor, client, settings);
      } catch (e) {
        new ErrorModal(app, e).open();
        loadingModal.close();
        return ;
      } finally {
        loadingModal.close();
      }

      const slug = pt.slug || '';
      if (slug && pt.published_at != null) {
        const viewUrl = `${settings.host}/${settings.listID}/p/${slug}`;
        new PublishResultModal(app, client, settings.listID, slug, viewUrl).open();
      }
    }
  },

  {
    id: 'quail-deliver',
    name: 'Deliver',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter, err } = await util.getActiveFileContent(app, editor);
      if (err != null) {
        new MessageModal(app, { message: err.toString() }).open();
        return;
      }

      const loadingModal = new LoadingModal(app)
      loadingModal.open();

      try {
        await client.deliverPost(settings.listID, frontmatter?.slug)
        new MessageModal(app, {
          title: "Delivery Requested",
          message: "This post has been added into the delivery queue. It may take a few minutes to send out."
        }).open();
      } catch (e) {
        loadingModal.close();
        console.log("deliver error: ", e)
        new ErrorModal(app, e).open();
        return;
      } finally {
        loadingModal.close();
      }
    }
  },

  {
    id: 'quail-ai-gen-metadata',
    name: 'Generate Metadata (by AI)',
    editorCallback: async (editor: Editor, view: MarkdownView) => {
      const { frontmatter, content } = util.getActiveFileFrontmatter(app, editor);
      const file = app.workspace.getActiveFile();
      if (file) {
        const loadingModal = new LoadingModal(app)
        loadingModal.open();

        const title = file.name.replace(/\.md$/, '');
        let fmc:any = null;
        if (frontmatter === null || Object.values(frontmatter).length === 0) {
          try {
            fmc = await fm.suggestFrontmatter(client, title, content, [])
            editor.setCursor({ line: 0, ch: 0 });
            editor.replaceSelection(fmc);
          } catch (e) {
            loadingModal.close();
            new ErrorModal(app, e).open();
          } finally {
            loadingModal.close();
          }
        } else {
          // @TODO replace frontmatter
          console.log("replace frontmatter: ", frontmatter);
          try {
            fmc = await fm.suggestFrontmatter(client, title, content, []);
            const pos = frontmatter.position;
            editor.setSelection(
              { line: (pos.start?.line as number), ch: (pos.start?.col as number) },
              { line: (pos.end?.line as number), ch: (frontmatter?.end?.col as number) })
            editor.replaceSelection(fmc);
          } catch (e) {
            loadingModal.close();
            new ErrorModal(app, e).open();
          } finally {
            loadingModal.close();
          }
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
          console.log("current frontmatter: ", frontmatter)
          const modal = new MessageModal(app, { title: "Metadata already exists", message: "Please edit manually or use AI to generate it" })
          modal.open();
        }
      }
    }
  },

  ]
}
