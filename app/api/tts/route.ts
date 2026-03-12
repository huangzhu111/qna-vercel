import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text, voice = 'xiaoyun' } = await request.json();
    const apiKey = process.env.ALIYUN_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: '请配置 API Key' }, { status: 500 });
    }

    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/audio/synthesis/t2a',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sambert-1-v1',
          input: { text },
          parameters: {
            voice,
            format: 'mp3',
            speech_rate: 0,
            pitch_rate: 0,
            volume: 50,
          },
        }),
      }
    );

    const data = await response.json();

    if (data.code === 'Success' || data.output?.audio) {
      const audioBase64 = data.output?.audio || data.data?.audio;
      if (audioBase64) {
        const audioUrl = `data:audio/mp3;base64,${audioBase64}`;
        return NextResponse.json({ audioUrl });
      }
      return NextResponse.json({ error: '无音频数据' }, { status: 500 });
    } else {
      return NextResponse.json(
        { error: '语音合成失败', details: data.message || data.msg },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('TTS错误:', error);
    return NextResponse.json({ error: '语音合成失败' }, { status: 500 });
  }
}
