import dayjs from "dayjs";

const formalizeFrontmatter = (frontmatter: any, text: string): any => {
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

  if (frontmatter?.tags?.trim().length !== 0) {
    ret.tags = frontmatter.tags?.trim() || "";
  }

  if (frontmatter?.title?.trim().length !== 0) {
    ret.title = frontmatter.title?.trim() || "";
  }

  return ret;
}

class Client{
  apikey = '';
  apibase = '';

	constructor(apikey: string, apibase = "https://api.quail.ink") {
    this.apikey = apikey;
    this.apibase = apibase;
	}

  async request (url: string, method: string, body: any, _headers = {}): Promise<any> {
    url = this.apibase + url;
    const headers :any = {}
    Object.assign(headers, {
      'Content-Type': 'application/json',
      'X-QUAIL-KEY': this.apikey,
    }, _headers);
    let payload:any = body;
    if (headers['Content-Type'] === 'application/json' && body) {
      payload = JSON.stringify(body);
    }
    const resp = await fetch(url, {
      method,
      headers,
      body: payload || null,
    });
    return resp.json();
  }

  async requestFormData (url: string, body: any): Promise<any> {
    url = this.apibase + url;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        'X-QUAIL-KEY': this.apikey,
      },
      body: body || null,
    });
    return resp.json();
  }

  async createPost (listID: any, payload:any): Promise<any> {
    return this.request(`/lists/${listID}/posts`, 'POST', payload)
  }

  async publishPost (listID: any, slug:any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${slug}/publish`, 'PUT', null)
  }

  async unpublishPost (listID: any, slug:any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${slug}/unpublish`, 'PUT', null)
  }

  async deliverPost (listID: any, slug:any): Promise<any> {
    return this.request(`/lists/${listID}/posts/${slug}/deliver`, 'PUT', null)
  }

  async createOrPublish (listID: any, title: string, text: string, frontmatter: any, images: string[]): Promise<any> {
    const fmt = formalizeFrontmatter(frontmatter, text);
    const payload = {
      slug: fmt.slug,
      title: fmt.title || title,
      cover_image_url: fmt.cover_image_url,
      summary: fmt.summary,
      content: text?.trim() || '',
      tags: fmt.tags,
      datetime: fmt.datetime,
    }
    // @TODO handle images
    const resp = await this.createPost(listID, payload);
    if (resp.code) {
      throw new Error(resp.msg);
    }
    return resp.data;
  }

  async uploadAttachment(img: any): Promise<any>  {
    const formData = new FormData();
    const picArray = new Uint8Array(img.data).buffer;
    formData.append('file', new Blob([picArray], { type: img.mimeType }), img.name);
    console.log("uploading", img.name, img.mimeType);
    const resp = await this.requestFormData(`/attachments`, formData);
    return resp.data;
  }

  async publish (listID: any, slug: string): Promise<any> {
    const resp = await this.publishPost(listID, slug);
    if (resp.code) {
      throw new Error(resp.msg);
    }
    return resp.data;
  }

  async unpublish (listID: any, slug: string): Promise<any> {
    const resp = await this.publishPost(listID, slug);
    if (resp.code) {
      throw new Error(resp.msg);
    }
    return resp.data;
  }

  async deliver (listID: any, slug: string): Promise<any> {
    const resp = await this.deliverPost(listID, slug);
    if (resp.code) {
      throw new Error(resp.msg);
    }
    return resp.data;
  }
}

export {
  Client
}