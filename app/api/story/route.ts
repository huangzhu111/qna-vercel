import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const apiKey = process.env.ALIYUN_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: '请配置 API Key' }, { status: 500 });
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
    
    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message.content;
      try {
        const result = JSON.parse(content);
        return NextResponse.json(result);
      } catch (e) {
        return NextResponse.json({ error: '解析失败' }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'API 返回错误' }, { status: 500 });
    }
  } catch (error) {
    console.error('生成故事错误:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
