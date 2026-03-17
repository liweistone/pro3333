
interface D1Database {
  prepare(sql: string): {
    bind(...params: any[]): {
      all<T = any>(): Promise<{ results: T[] }>;
    };
  };
}

type PagesFunction<Env = any> = (context: {
  env: Env;
  request: Request;
  params: Record<string, string>;
}) => Promise<Response> | Response;

/**
 * Cloudflare Pages 后端代理：对接 D1 数据库
 */
export const onRequest: PagesFunction<{ DB: D1Database }> = async (context) => {
  const { env, request } = context;
  const db = env.DB;
  
  if (!db) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "D1 BINDING_NOT_FOUND: 请确保 Pages 设置中变量名为 DB 且已重新部署。" 
    }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  
  const url = new URL(request.url);
  const category = url.searchParams.get('category') || '全部';
  const query = url.searchParams.get('q') || '';
  // 修正 limit 解析
  const limitParam = url.searchParams.get('limit');
  const limit = Math.min(limitParam ? parseInt(limitParam) : 50, 100);

  try {
    let sql = "SELECT * FROM presets WHERE visibility = 'public'";
    const params: any[] = [];

    if (category !== '全部') {
      sql += " AND category_id = ?";
      params.push(category);
    }

    if (query) {
      sql += " AND (title LIKE ? OR positive LIKE ?)";
      const lq = `%${query}%`;
      params.push(lq, lq);
    }

    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    const { results } = await db.prepare(sql).bind(...params).all();

    return new Response(JSON.stringify(results || []), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache" 
      },
    });
  } catch (error: any) {
    const isTableMissing = error.message.includes("no such table");
    return new Response(JSON.stringify({ 
      success: false, 
      error: isTableMissing ? "数据库表 presets 尚未创建" : error.message,
      debug_hint: "请确认 D1 中 presets 表已建立并存有数据"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
