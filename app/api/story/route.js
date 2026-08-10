export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request) {
  // 兼容大小写
  const apiKey = process.env.ALIYUN_API_KEY || process.env.aliyun_api_key;

  if (!apiKey) {
    console.error('API Key 未配置');
    return Response.json({ error: 'API Key 未配置，请在 Vercel 环境变量中添加 ALIYUN_API_KEY' }, { status: 500, headers: CORS_HEADERS });
  }

  // 读取前端传来的主题/家庭素材（可选，前端 story.js 会传）
  let theme = '';
  let family = '';
  try {
    const body = await request.json();
    theme = (body && body.theme) || '';
    family = (body && body.family) || '';
  } catch (e) {
    // 无 body 也允许（兼容旧调用）
  }

  const themes = [
    "日常生活", "购物", "旅行", "家庭聚会",
    "户外活动", "美食", "兴趣爱好", "节日庆祝",
    "邻里互动", "健康锻炼"
  ];
  const randomTheme = theme || themes[Math.floor(Math.random() * themes.length)];

  // 随机人物/地点，增强多样性，避免重复
  const people = ['妈妈', '奶奶', '爷爷', '王阿姨', '邻居李奶奶', '张叔叔'];
  const places = ['公园', '菜市场', '小区花园', '河边', '楼下的长椅', '阳台'];
  const randomPerson = people[Math.floor(Math.random() * people.length)];
  const randomPlace = places[Math.floor(Math.random() * places.length)];

  const familyLine = family ? `\n家庭素材（请尽量自然融入故事，例如使用这些家人名字、城市、爱好）：${family}` : '';

  const systemPrompt = `你是一个认知训练专家，为阿兹海默症患者生成记忆训练故事。
要求：
1. 故事50-80字，简单易懂，情节清晰，语气温暖
2. 包含具体的人物、时间、地点
3. 每次生成必须完全不同，避免重复（换场景、换人物、换事件）
4. 故事结束后给出3个选择题，每题只有2个选项（A和B），答案必须是"A"或"B"
5. 问题基于故事内容，难度温和，不设陷阱${familyLine}

请严格按照以下JSON格式输出，不要有任何其他内容：
{"story":"故事正文","questions":[{"question":"问题文字","options":["A. 选项1","B. 选项2"],"answer":"A"},{"question":"问题文字","options":["A. 选项1","B. 选项2"],"answer":"B"},{"question":"问题文字","options":["A. 选项1","B. 选项2"],"answer":"A"}]}`;

  const userPrompt = `请生成一个关于"${randomTheme}"主题的记忆训练故事。故事主角可以是${randomPerson}，场景可以是${randomPlace}，请自由发挥，确保和任何已生成过的故事都不一样。`;

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
            { role: 'user', content: userPrompt }
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
        return Response.json(result, { headers: CORS_HEADERS });
      } catch (e) {
        console.error('JSON解析错误:', e);
        return Response.json({ error: '解析失败: ' + content.substring(0, 100) }, { status: 500, headers: CORS_HEADERS });
      }
    } else {
      console.error('API返回错误:', data);
      return Response.json({ error: 'API返回错误: ' + JSON.stringify(data).substring(0, 200) }, { status: 500, headers: CORS_HEADERS });
    }
  } catch (error) {
    console.error('生成故事错误:', error);
    return Response.json({ error: '生成失败: ' + error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
