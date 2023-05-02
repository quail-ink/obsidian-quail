import dayjs from "dayjs";

function encodeQuote(str:string) {
  return str.replace(/"/g, '\\"');
}

export default {
  suggestFrontmatter: async function(client:any, title: string, content: string, images: any[]) {
    const ret:Record<string, string|number> = {};
    // default datetime
    const now = dayjs();
    ret["datetime"] = now.format("YYYY-MM-DD HH:mm");

    // default slug, summary, tags
    const resp = await client.generateFrontmatter(title, content)
    ret["slug"] = encodeQuote(resp.slug as string);
    ret["summary"] = encodeQuote(resp.summary as string);
    ret["tags"] = encodeQuote(resp.tags as string);
    ret["cover_image_url"] = encodeQuote("YOUR_NOTE_COVER_IMAGE_URL");
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
cover_image_url: "INSERT_YOUR_NOTE_COVER_IMAGE_URL_HERE"
---\n\n`;
  },
}