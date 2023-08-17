import { App, Editor, MarkdownView } from 'obsidian';
import { LoadingModal, MessageModal, ErrorModal, PublishResultModal } from './modal';
import util from './util';
import { QuailPluginSettings } from './interface';
import fm from "./frontmatter";

async function uploadAttachment(client: any, image: any) {
  const formData = new FormData();
  const picArray = new Uint8Array(image.data).buffer;

  formData.append('file', new Blob([picArray], { type: image.mimeType }), image.name);

  const resp = await client.uploadAttachment(formData);
  return resp.view_url
}

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
      try {
        const viewUrl = await uploadAttachment(client, img)
        newUrls.push(viewUrl)
        oldUrls.push(img.pathname)
        console.log(`upload image: ${img.pathname}, new url: ${viewUrl}`)
      } catch (e) {
        new ErrorModal(app, new Error(e)).open();
        return { frontmatter: null, content: null};
      }
    }
  }

  // upload cover image
  if (frontmatter?.cover_image) {
    try {
      const viewUrl = await uploadAttachment(client, frontmatter.cover_image)
      frontmatter.cover_image_url = viewUrl;
      console.log(`upload cover: ${frontmatter.cover_image.pathname}, new url: ${viewUrl}`)
    } catch (e) {
      new ErrorModal(app, new Error(e)).open();
      return { frontmatter: null, content: null};
    }
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

  if (frontmatter == null || content == null) {
    return;
  }

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
        return;ErrorModal
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
    id: 'unpublish',
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
    id: 'save',
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
    id: 'deliver',
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
    id: 'ai-gen-metadata',
    name: 'Generate metadata by AI',
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
    id: 'insert-metadata',
    name: 'Insert metadata template',
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

  // {
  //   id: 'test',
  //   name: "Test",
  //   editorCallback: async (editor: Editor, view: MarkdownView) => {
  //   }
  // }
  ]
}
