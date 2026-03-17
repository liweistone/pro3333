
// app7/utils/apiClient.ts

// Define Fetcher type for Cloudflare environment if not globally available
export interface Fetcher {
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

interface CloudflareEnv {
  CLOUDFLARE_WEBSITE: Fetcher;
}

export const createPresetApiClient = (env?: CloudflareEnv) => {
  // 确定基础 URL
  const getBaseUrl = () => {
    // 安全地检测是否在 Node.js 环境中，避免在浏览器中报错
    const isNodeEnv = typeof process !== 'undefined' && 
                      (process as any).versions != null && 
                      (process as any).versions.node != null;
    
    if (typeof window !== 'undefined') {
      // 浏览器环境
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 开发环境
        return 'https://cloudflare-website.liwei791214.workers.dev'; 
      } else {
        // 生产环境，直接使用相对路径
        return '';
      }
    } else if (isNodeEnv) {
      // Node.js 环境
      return 'https://cloudflare-website.liwei791214.workers.dev';
    } else {
      // 其他环境
      return '';
    }
  };

  const baseUrl = getBaseUrl();

  return {
    presets: {
      // 获取预设分类
      getCategories: async () => {
        let url;
        let fetchPromise;
        
        if (env) {
          url = '/api/presets/categories';
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          url = `${baseUrl}/api/presets/categories`;
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 获取预设列表
      getList: async (params?: { category_id?: string; sort?: string; page?: number; limit?: number }) => {
        let url = `${baseUrl}/api/presets`;
        
        if (params) {
          const searchParams = new URLSearchParams();
          if (params.category_id) searchParams.append('category_id', params.category_id);
          if (params.sort) searchParams.append('sort', params.sort);
          if (params.page) searchParams.append('page', params.page.toString());
          if (params.limit) searchParams.append('limit', params.limit.toString());
          
          url += `?${searchParams.toString()}`;
        }
        
        let fetchPromise;
        if (env) {
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 获取预设详情
      getDetail: async (id: string) => {
        const url = `${baseUrl}/api/presets/${id}`;
        
        let fetchPromise;
        if (env) {
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else {
          fetchPromise = fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
        
        const response = await fetchPromise;
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`API返回非JSON数据，状态码: ${response.status}`);
        }
        
        return response;
      },
      
      // 收藏
      favorite: async (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        let fetchPromise;
        if (env) {
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, { method: 'POST', headers });
        } else {
          fetchPromise = fetch(url, { method: 'POST', headers });
        }
        
        return await fetchPromise;
      },
      
      // 取消收藏
      unfavorite: async (id: string, token: string) => {
        const url = `${baseUrl}/api/presets/${id}/favorite`;
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        let fetchPromise;
        if (env) {
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, { method: 'DELETE', headers });
        } else {
          fetchPromise = fetch(url, { method: 'DELETE', headers });
        }
        
        return await fetchPromise;
      },
      
      // 记录使用
      recordUse: async (id: string) => {
        const url = `${baseUrl}/api/presets/${id}/use`;
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };

        let fetchPromise;
        if (env) {
          const relativePath = url.replace(baseUrl, '');
          fetchPromise = env.CLOUDFLARE_WEBSITE.fetch(relativePath, { method: 'POST', headers });
        } else {
          fetchPromise = fetch(url, { method: 'POST', headers });
        }
        
        return await fetchPromise;
      }
    }
  };
};
