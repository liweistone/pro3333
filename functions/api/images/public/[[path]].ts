
// Fix: Added missing R2Bucket interface definition for Cloudflare environment
interface R2Bucket {
  get(key: string): Promise<{
    body: any;
    httpEtag: string;
    writeHttpMetadata(headers: Headers): void;
  } | null>;
}

// Fix: Added missing PagesFunction type definition for Cloudflare environment
type PagesFunction<Env = any> = (context: {
  env: Env;
  request: Request;
  params: Record<string, string | string[]>;
}) => Promise<Response> | Response;

type Env = {
  MY_BUCKET: R2Bucket;
};

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  
  // 获取贪婪匹配的路径数组并拼接成完整 Key
  const pathArray = params.path as string[];
  if (!pathArray || pathArray.length === 0) {
    return new Response("Missing Image Key", { status: 400 });
  }
  
  const key = pathArray.join('/');

  try {
    const object = await env.MY_BUCKET.get(key);

    if (object === null) {
      return new Response("Object Not Found in R2", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // 强缓存提升加载速度

    return new Response(object.body, {
      headers,
    });
  } catch (e: any) {
    return new Response(`R2 Error: ${e.message}`, { status: 500 });
  }
};
