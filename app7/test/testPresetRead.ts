// app7/test/testPresetRead.ts
// 预设读取功能测试脚本

import { createPresetApiClient } from '../utils/apiClient';

// 创建 API 客户端实例
const apiClient = createPresetApiClient();

/**
 * 测试预设分类获取功能
 */
async function testGetCategories() {
  console.log('开始测试获取预设分类...');
  
  try {
    const response = await apiClient.presets.getCategories();
    
    if (!response.ok) {
      console.error('获取预设分类失败:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✓ 成功获取预设分类:', Object.keys(data).length, '个分类');
    console.log('分类数据:', data);
    return true;
  } catch (error) {
    console.error('获取预设分类时发生错误:', error);
    return false;
  }
}

/**
 * 测试预设列表获取功能
 */
async function testGetPresetList() {
  console.log('\\n开始测试获取预设列表...');
  
  try {
    const response = await apiClient.presets.getList();
    
    if (!response.ok) {
      console.error('获取预设列表失败:', response.status, response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('✓ 成功获取预设列表:', data.presets ? data.presets.length : data.data?.length || 0, '个预设');
    console.log('预设数据:', data);
    return true;
  } catch (error) {
    console.error('获取预设列表时发生错误:', error);
    return false;
  }
}

/**
 * 测试预设详情获取功能（使用第一个预设的ID）
 */
async function testGetPresetDetail() {
  console.log('\\n开始测试获取预设详情...');
  
  try {
    // 先获取预设列表，然后尝试获取第一个预设的详情
    const listResponse = await apiClient.presets.getList();
    
    if (!listResponse.ok) {
      console.error('获取预设列表失败，无法测试详情功能:', listResponse.status, listResponse.statusText);
      return false;
    }
    
    const listData = await listResponse.json();
    const presets = listData.presets || listData.data || [];
    
    if (presets.length === 0) {
      console.log('⚠ 没有找到预设数据，跳过详情测试');
      return true;
    }
    
    const firstPresetId = presets[0].id;
    console.log('尝试获取预设详情，ID:', firstPresetId);
    
    const detailResponse = await apiClient.presets.getDetail(firstPresetId);
    
    if (!detailResponse.ok) {
      console.error('获取预设详情失败:', detailResponse.status, detailResponse.statusText);
      return false;
    }
    
    const detailData = await detailResponse.json();
    console.log('✓ 成功获取预设详情');
    console.log('预设详情:', detailData);
    return true;
  } catch (error) {
    console.error('获取预设详情时发生错误:', error);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('开始测试预设读取功能...\\n');
  
  let allTestsPassed = true;
  
  // 测试预设分类
  const categoriesTest = await testGetCategories();
  if (!categoriesTest) {
    allTestsPassed = false;
  }
  
  // 测试预设列表
  const listTest = await testGetPresetList();
  if (!listTest) {
    allTestsPassed = false;
  }
  
  // 测试预设详情
  const detailTest = await testGetPresetDetail();
  if (!detailTest) {
    allTestsPassed = false;
  }
  
  console.log('\\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('✓ 所有预设读取功能测试通过！');
  } else {
    console.log('✗ 部分预设读取功能测试失败');
  }
  console.log('='.repeat(50));
  
  return allTestsPassed;
}

// 运行测试
runTests()
  .then(success => {
    if (success) {
      console.log('\\n预设读取功能验证成功！');
    } else {
      console.log('\\n预设读取功能存在问题，请检查网络连接和API配置');
    }
  })
  .catch(error => {
    console.error('\\n测试过程中发生严重错误:', error);
  });

export { runTests, testGetCategories, testGetPresetList, testGetPresetDetail };