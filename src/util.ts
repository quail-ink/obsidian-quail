import { App, Editor } from 'obsidian';

export default {
  getImagePaths : function (markdownContent: string) {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g; // matches markdown image syntax
    const matches = [];
    let match;
    while ((match = imageRegex.exec(markdownContent))) {
      matches.push(match[2]); // add second capture group (the image path)
    }
    return matches;
  },

  getMimeType: function (ext: string) {
    const mimeTypeMap :Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml'
    };
    const mimeType = mimeTypeMap[ext.toLowerCase()];
    if (!mimeType) {
      return null
    }

    return mimeType;
  },

  getActiveFileContent: async function (app: App, editor: Editor) {
    const file = app.workspace.getActiveFile();
    const text = editor.getDoc().getValue();
    let body = text
    if (file) {
      console.log("file", file.path)
      const fmc = app.metadataCache.getFileCache(file)?.frontmatter;
      if (fmc) {
        const end = fmc.position.end.line + 1 // accont for ending ---
        body = text.split("\n").slice(end).join("\n")
        console.log("fmc", fmc)
      }

      const coverImagePath = fmc?.cover_image_url?.trim() || ""

      const imgPathItems = this.getImagePaths(body);
      if (coverImagePath) {
        if (!coverImagePath.startsWith("https://") && !coverImagePath.startsWith("http://")) {
          imgPathItems.push(coverImagePath)
        }
      }
      const imgPathMap :Record<string, any> = {};
      for (let ix = 0; ix < imgPathItems.length; ix++) {
        // @TODO: this is a hack, but it works for now
        const formalizedPathname = imgPathItems[ix].replace(/^\.\//, '')
        imgPathMap[formalizedPathname] = {
          pathname: imgPathItems[ix],
          formalizedPathname,
        }
      }

      let coverImage = null;
      const files = app.vault.getFiles();
      const images:Array<any> = [];
      for (let ix = 0; ix < files.length; ix++) {
        const fd = files[ix];
        if (imgPathMap[fd.path]) {
          const mimeType = this.getMimeType(fd.extension)
          if (mimeType === "") {
            continue;
          }
          const img = await app.vault.readBinary(fd)
          if (img.byteLength) {
            console.log("found: " + fd.path + ", " + img.byteLength);
            const imgWrapper = {
              pathname: imgPathMap[fd.path].pathname,
              formalizedPath: fd.path,
              name: fd.name,
              data: img,
              mimeType,
            }
            if (imgPathMap[fd.path].pathname === coverImagePath) {
              coverImage = imgWrapper
            } else {
              images.push(imgWrapper);
            }
          }
        }
      }

      const title = file.name.replace(/\.md$/, '');

      return {
        title,
        content: body,
        frontmatter: {
          title: fmc?.title || '',
          slug: fmc?.slug || '',
          tags: fmc?.tags || '',
          datetime: fmc?.datetime || '',
          summary: fmc?.summary || '',
          cover_image_url: fmc?.cover_image_url || '',
          cover_image: coverImage,
        },
        images,
        err: null,
      }
    }
    return {
      title: "",
      content: "",
      frontmatter: null,
      images: [],
      err: "no active file",
    }
  },

  replaceImageUrls: function (content: string, oldUrls: string[], newUrls: string[]) {
    if (oldUrls.length !== newUrls.length) {
      console.log("the number of old and new urls do not match, return original content");
      return content;
    }
    for (let ix = 0; ix < oldUrls.length; ix++) {
      const oldUrl = oldUrls[ix];
      const imageUrlPattern = new RegExp(`(!\\[[^\\]]*\\])\\(${oldUrl}\\)`, 'g');
      content = content.replace(imageUrlPattern, `$1(${newUrls[ix]})`);
      console.log("replace " + oldUrl + " with " + newUrls[ix]);
    }
    return content
  },
}