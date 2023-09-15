import dayjs from "dayjs";

function encodeQuote(str:string) {
  return str.replace(/"/g, '\\"');
}

export default {
  suggestFrontmatter: async function(client:any, title: string, content: string, images: any[]) {
    const ret:Record<string, any> = {};
    // default datetime
    const now = dayjs();
    ret["datetime"] = now.format("YYYY-MM-DD HH:mm");

    // default slug, summary, tags
    const resp = await client.generateFrontmatter(title, content)
    ret["slug"] = encodeQuote(resp.slug as string);
    ret["summary"] = encodeQuote(resp.summary as string);
    ret["tags"] = encodeQuote(resp.tags as string);
    ret["cover_image_url"] = "";
    return `---
slug: "${ret.slug}"
datetime: "${ret.datetime}"
summary: "${ret.summary}"
tags: "${ret.tags}"
cover_image_url: "${ret.cover_image_url}"
---\n\n`;
  },

  emptyFrontmatter: function() {
    const now = dayjs();
    return `---
slug: "INSERT_YOUR_SLUG_HERE"
datetime: "${now.format("YYYY-MM-DD HH:mm")}"
summary: "INSERT_YOUR_SUMMARY_HERE"
tags: "INSERT_YOUR_TAGS_HERE"
cover_image_url: ""
---\n\n`;
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
          case "tags": {
            // tags is string, split by ','
            console.log(typeof value, value.constructor.name);
            const re = /\s*([^\s,]+)\s*(?:,\s*|$)/g;
            if (typeof value === "string") {
              const trimed = value.trim();
              if (trimed.length !== 0) {
                if (re.test(trimed)) {
                  obj.validated = true;
                } else {
                  obj.reason = '`tags` must be string, split by comma';
                }
              } else {
                obj.validated = true;
              }
            } else if (Array.isArray(value)) {
              obj.validated = true;
            } else {
              obj.reason = '`tags` must be string';
            }
            keys[key] = obj;
          break;
          }
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
  },

  formalizeFrontmatter: function (frontmatter: any, text: string): any {
    const ret :Record<string,any> = {}
    if (frontmatter?.slug?.trim().length === 0) {
      return false
    }
    ret.slug = frontmatter.slug.trim();

    if (frontmatter?.datetime?.trim().length !== 0) {
      try {
        ret.datetime = dayjs(frontmatter.datetime.trim()).format('YYYY-MM-DDTHH:mm:ssZ');
      } catch (e) {
        ret.datetime = dayjs().format('YYYY-MM-DDTHH:mm:ssZ');
      }
    } else {
      ret.datetime = dayjs().format('YYYY-MM-DDTHH:mm:ssZ');
    }

    if (frontmatter?.summary?.trim().length !== 0) {
      ret.summary = frontmatter.summary?.trim().slice(0, 120) || text.trim().slice(0, 120);
    } else {
      // the first 120 characters of the text
      ret.summary = text.trim().slice(0, 120);
    }

    if (frontmatter?.cover_image_url?.trim().length !== 0) {
      ret.cover_image_url = frontmatter.cover_image_url?.trim() || "";
    }

    if (frontmatter?.tags.constructor.name === "Array") {
      if (frontmatter?.tags.length !== 0) {
        ret.tags = frontmatter.tags.join(",") || "";
      }
      const tags = frontmatter.tags.map((x:any) => {
        if (typeof x === "string") {
          return x.trim();
        }
        return "";
      }).filter((x:any) => x.length !== 0);
      ret.tags = tags.join(",") || "";
    } else if (frontmatter?.tags.constructor.name === "String") {
      if (frontmatter?.tags?.trim().length !== 0) {
        ret.tags = frontmatter.tags?.trim() || "";
      }
    } else {
      ret.tags = "";
    }

    if (frontmatter?.title?.trim().length !== 0) {
      ret.title = frontmatter.title?.trim() || "";
    }

    return ret;
  }
}

