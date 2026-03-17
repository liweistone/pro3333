// app7/test/simple-fetch-test.ts
// 简单的 API 测试脚本

async function testApiCall() {
  console.log('开始测试 API 调用...');
  
  try {
    // 直接调用 API 端点
    console.log('\\n正在调用: https://cloudflare-website.liwei791214.workers.dev/api/presets/categories');
    
    const response = await fetch('https://cloudflare-website.liwei791214.workers.dev/api/presets/categories', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', [...response.headers.entries()]);
    
    if (!response.ok) {
      console.error('请求失败:', response.status, response.statusText);
      return;
    }
    
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.log('响应内容（非JSON）:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      console.error('错误: 响应不是JSON格式');
      return;
    }
    
    const data = await response.json();
    console.log('API 响应数据:', JSON.stringify(data, null, 2));
    
    console.log('\\n✅ API 调用成功!');
    console.log('分类数量:', Object.keys(data).length);
    console.log('分类列表:', Object.entries(data).map(([id, name]) => `  ${id}: ${name}`));
  } catch (error) {
    console.error('\\n❌ API 调用失败:', error);
  }
}

// 运行测试
testApiCall();