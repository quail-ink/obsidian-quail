import { App, Editor } from 'obsidian';
// import { QuailImageItem } from './interface';

export default {
  getImagePaths : function (markdownContent: string) {
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g; // matches markdown image syntax
    const matches:string[] = [];
    let match:RegExpExecArray|null = null;
    while ((match = imageRegex.exec(markdownContent))) {
      if (match && match.length > 2) {
        const item = match[2];
        if (!item.startsWith("https://") && !item.startsWith("http://")) {
          matches.push(item);
        }
      }
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

  getActiveFileFrontmatter: function (app: App, editor: Editor) {
    const file = app.workspace.getActiveFile();
    const text = editor.getDoc().getValue();
    let content = text;
    if (file === null) {
      return {frontmatter: null, content: ""}
    }

    const frontmatter:Record<string, string|number> = {}
    const fmc = app.metadataCache.getFileCache(file)?.frontmatter;
    if (fmc && fmc !== undefined) {
      const end = fmc.position.end.line + 1; // accont for ending ---
      content = text.split("\n").slice(end).join("\n");
      for (const key in fmc) {
        if (Object.prototype.hasOwnProperty.call(fmc, key)) {
          const item = fmc[key];
          frontmatter[key] = item;
        }
      }
      console.log("get frontmatter:", frontmatter);
    }

    return {
      frontmatter,
      content,
    }
  },

  getActiveFileContent: async function (app: App, editor: Editor) {
    const file = app.workspace.getActiveFile();
    if (file) {
      console.log("file", file.path)
      // const fmc = app.metadataCache.getFileCache(file)?.frontmatter;
      // if (fmc) {
      //   const end = fmc.position.end.line + 1 // accont for ending ---
      //   body = text.split("\n").slice(end).join("\n")
      //   console.log("fmc", fmc)
      // }

      const { frontmatter: fmc, content } = this.getActiveFileFrontmatter(app, editor)

      const coverImagePath = fmc?.cover_image_url?.trim() || ""

      const imgPathItems = this.getImagePaths(content);
      if (coverImagePath) {
        if (!coverImagePath.startsWith("https://") && !coverImagePath.startsWith("http://")) {
          imgPathItems.push(coverImagePath)
        }
      }

      const imgPathMap :Record<string, any> = {};
      for (let ix = 0; ix < imgPathItems.length; ix++) {
        // @TODO: this is a hack, but it works for now
        const formalizedPathname = decodeURIComponent(imgPathItems[ix]).replace(/^\.\//, '')
        imgPathMap[formalizedPathname] = {
          pathname: imgPathItems[ix],
          formalizedPathname,
        }
      }

      let coverImage:any = null;
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
        content,
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

  verifyFrontmatter: function (frontmatter: Record<string, any>): { verified: boolean, reason: string } {
    const keys: Record<string, any> = {};

    // slug is required
    if (!frontmatter.slug) {
      return { verified: false, reason: '`slug` is required' };
    }

    for (const key in frontmatter) {
      if (Object.prototype.hasOwnProperty.call(frontmatter, key)) {
        const value = frontmatter[key];
        const obj:any = { validated: false, reason: '' };
        switch (key) {
          case "slug":
            // slug is number, english, dash
            if (typeof value === "string") {
              if (/^[a-zA-Z0-9-]+$/.test(value)) {
                obj.validated = true;
              } else {
                obj.reason = '`slug` can only contain english, number and dash';
              }
            } else {
              obj.reason = '`slug` must be string';
            }
            keys[key] = obj;
          break;
          case "title":
            // title is string
            if (typeof value === "string") {
              obj.validated = true;
            } else {
              obj.reason = '`title` must be string';
            }
            keys[key] = obj;
          break;
          case "tags":
            // tags is string, split by ','
            if (typeof value === "string") {
              const trimed = value.trim();
              if (trimed.length !== 0) {
                if (/^[a-zA-Z0-9-]+(,[a-zA-Z0-9-]+)*$/.test(trimed)) {
                  obj.validated = true;
                } else {
                  obj.reason = '`tags` must be string, split by comma';
                }
              } else {
                obj.validated = true;
              }
            } else {
              obj.reason = '`tags` must be string, split by comma';
            }
            keys[key] = obj;
          break;
          case "datetime":
            // datetime is string that can be parsed by dayjs
            if (typeof value === "string") {
              obj.validated = true;
            } else {
              obj.reason = '`datetime` must be date string';
            }
            keys[key] = obj;
          break;
          case "summary":
            // summary is string
            if (typeof value === "string") {
              obj.validated = true;
            } else {
              obj.reason = '`summary` must be string';
            }
            keys[key] = obj;
          break;
          case "cover_image_url":
            // cover_image_url is string
            if (typeof value === "string") {
              obj.validated = true;
            } else {
              obj.reason = '`cover_image_url` must be string';
            }
            keys[key] = obj;
          break;
          default:
          break;
        }
      }
    }

    for (const key in keys) {
      if (Object.prototype.hasOwnProperty.call(keys, key)) {
        const item = keys[key];
        if (!item.validated) {
          return item;
        }
      }
    }
    return { verified: true, reason: '' };
  }
}