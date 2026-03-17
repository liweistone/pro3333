// 简化的配置，等待安装依赖后完善
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://aideator.top',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
}