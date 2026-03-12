/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允许外部 API 请求
  async rewrites() {
    return [
      {
        source: '/api/tts',
        destination: 'https://dashscope.aliyuncs.com/api/v1/services/audio/synthesis/t2a',
      },
    ];
  },
};

module.exports = nextConfig;
