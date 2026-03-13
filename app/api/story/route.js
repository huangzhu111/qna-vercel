export const dynamic = 'force-dynamic';

export async function POST() {
  // 兼容大小写
  const apiKey = process.env.ALIYUN_API_KEY || process.env.aliyun_api_key;
  
  console.log('API Key present:', !!apiKey);
  
  if (!apiKey) {
    console.error('API Key 未配置');
    return Response.json({ error: 'API Key 未配置，请在 Vercel 环境变量中添加 ALIYUN_API_KEY' }, { status: 500 });
  }

  const themes = [
    "日常生活", "购物", "旅行", "家庭聚会", 
    "户外活动", "美食", "兴趣爱好", "节日庆祝",
    "邻里互动", "健康锻炼"
  ];
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  
  const systemPrompt = `你是一个认知训练专家。请生成一个50-80字的简短故事。
主题要求：${randomTheme}
要求：
1. 故事主题鲜明，与给定主题相关
2. 简单易懂，情节清晰
3. 包含具体的人物、时间、地点
4. 故事结束后，直接给出3个选择题

请严格按照以下JSON格式输出，不要有其他内容：
{"story": "故事正文", "questions": [{"question": "问题文字", "options": ["A. 选项1", "B. 选项2"], "answer": "A或B"}]}`;

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请生成一个关于"${randomTheme}"主题的记忆训练故事。` }
          ],
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data));
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      try {
        const result = JSON.parse(content);
        return Response.json(result);
      } catch (e) {
        console.error('JSON解析错误:', e);
        return Response.json({ error: '解析失败: ' + content.substring(0, 100) }, { status: 500 });
      }
    } else {
      console.error('API返回错误:', data);
      return Response.json({ error: 'API返回错误: ' + JSON.stringify(data).substring(0, 200) }, { status: 500 });
    }
  } catch (error) {
    console.error('生成故事错误:', error);
    return Response.json({ error: '生成失败: ' + error.message }, { status: 500 });
  }
}
