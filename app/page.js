'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [screen, setScreen] = useState('start');
  const [story, setStory] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // iOS 需要先解锁音频
  const unlockAudio = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // 播放一个静音来解锁 iOS 音频
      const silentUtterance = new SpeechSynthesisUtterance(' ');
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
    }
  };
  useState(() => {
    try {
      const h = JSON.parse(localStorage.getItem('qna-history') || '[]');
      setHistory(h);
    } catch {}
  });

  async function startGame() {
    setLoading(true);
    try {
      const res = await fetch('/api/story', { method: 'POST' });
      const data = await res.json();
      if (!data.story) throw new Error('生成失败');
      setStory(data.story);
      setQuestions(data.questions);
      setCurrentQuestion(0);
      setCorrectCount(0);
      setSelectedOption(null);
      setScreen('story');
    } catch (error) {
      alert('生成故事失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function playStory() {
    setLoading(true);
    
    // iOS 需要先解锁音频
    unlockAudio();
    
    // 等待一下
    await new Promise(r => setTimeout(r, 100));
    
    try {
      // 先尝试浏览器自带语音（兼容性更好）
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(story);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        await new Promise(resolve => {
          utterance.onend = resolve;
          utterance.onerror = resolve;
          window.speechSynthesis.speak(utterance);
        });
        setLoading(false);
        return;
      }
      
      // 备用：尝试 API 语音
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: story })
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        await audio.play();
      }
    } catch (error) {
      console.log('TTS error, using browser fallback:', error);
      // 最后备用：浏览器语音
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(story);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoading(false);
    }
  }

  function goToQuestions() {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setScreen('questions');
  }

  function selectOption(option) {
    if (selectedOption) return;
    setSelectedOption(option);
    const q = questions[currentQuestion];
    if (option === q.answer) {
      setCorrectCount(prev => prev + 1);
    }
  }

  function nextQuestion() {
    if (currentQuestion >= questions.length - 1) {
      // 保存历史
      const score = Math.round((correctCount / 3) * 100);
      const newHistory = [{ score, date: new Date().toLocaleDateString('zh-CN') }, ...history].slice(0, 10);
      setHistory(newHistory);
      try {
        localStorage.setItem('qna-history', JSON.stringify(newHistory));
      } catch {}
      setScreen('result');
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
    }
  }

  async function playResult() {
    let message = '';
    const score = Math.round((correctCount / 3) * 100);
    if (score >= 100) message = '太棒了！你全部答对！';
    else if (score >= 66) message = '很不错哦！你答对了' + correctCount + '道题，继续加油！';
    else if (score >= 33) message = '加油！你答对了' + correctCount + '道题，多练习会更好的！';
    else message = '别灰心，慢慢来！你答对了' + correctCount + '道题。';
    
    setLoading(true);
    try {
      // 先尝试浏览器自带语音
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        await new Promise(resolve => {
          utterance.onend = resolve;
          utterance.onerror = resolve;
          window.speechSynthesis.speak(utterance);
        });
        setLoading(false);
        return;
      }
      
      // 备用：API 语音
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message })
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        await audio.play();
      }
    } catch {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = 'zh-CN';
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoading(false);
    }
  }

  const currentQ = questions[currentQuestion];
  const score = Math.round((correctCount / 3) * 100);

  return (
    <div className="container">
      <header>
        <h1>🧠 记忆故事问答</h1>
        <p className="subtitle">每天练习一小步，记忆力棒棒的！</p>
      </header>

      {/* 开始界面 */}
      {screen === 'start' && (
        <div className="screen">
          <div className="welcome-card">
            <div className="icon">📖</div>
            <h2>欢迎来听故事！</h2>
            <p>点击下方按钮，我会给你讲一个小故事，然后问你几个问题。</p>
            <button className="btn btn-primary btn-large" onClick={startGame} disabled={loading}>
              {loading ? '生成中...' : '▶️ 开始听故事'}
            </button>
          </div>
          <div className="history-card">
            <h3>📊 历史记录</h3>
            {history.length === 0 ? (
              <p className="empty">暂无记录</p>
            ) : (
              history.map((item, i) => (
                <div key={i} className="history-item">
                  <span className="date">{item.date}</span>
                  <span className="score">{item.score}分</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 故事界面 */}
      {screen === 'story' && (
        <div className="screen">
          <div className="story-card">
            <h2>📝 故事内容</h2>
            <div className="story-text">
              <p>{story}</p>
            </div>
            <div className="audio-controls">
              <button className="btn btn-secondary" onClick={playStory} disabled={loading}>
                🔊 播放故事
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-large" onClick={goToQuestions}>
            听完了，去答题 →
          </button>
        </div>
      )}

      {/* 答题界面 */}
      {screen === 'questions' && currentQ && (
        <div className="screen">
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">问题 {currentQuestion + 1}/3</span>
            </div>
            <h2 className="question-text">{currentQ.question}</h2>
            <div className="options-container">
              <button 
                className={`option-btn ${selectedOption === 'A' ? 'selected' : ''}`}
                onClick={() => selectOption('A')}
                disabled={selectedOption !== null}
              >
                {currentQ.options?.[0] || 'A'}
              </button>
              <button 
                className={`option-btn ${selectedOption === 'B' ? 'selected' : ''}`}
                onClick={() => selectOption('B')}
                disabled={selectedOption !== null}
              >
                {currentQ.options?.[1] || 'B'}
              </button>
            </div>
            <p className="record-hint">点击 A 或 B 选择答案</p>
            {selectedOption && (
              <div className="answer-display">
                <p>你的选择：{currentQ.options?.[selectedOption === 'A' ? 0 : 1]}</p>
              </div>
            )}
          </div>
          <div className="question-nav">
            <button 
              className="btn btn-primary btn-large" 
              disabled={!selectedOption}
              onClick={nextQuestion}
            >
              {currentQuestion >= 2 ? '查看结果' : '下一题 →'}
            </button>
          </div>
        </div>
      )}

      {/* 结果界面 */}
      {screen === 'result' && (
        <div className="screen">
          <div className="result-card">
            <div className="score-circle">
              <span>{score}</span>
              <span className="score-label">分</span>
            </div>
            <h2>
              {correctCount === 3 ? '太棒了！全部答对！🎉' :
               correctCount >= 2 ? '很不错哦！继续加油！💪' :
               correctCount >= 1 ? '加油！多练习会更好！🌟' :
               '别灰心，慢慢来！❤️'}
            </h2>
            <div className="result-details">
              <p>回答正确：<span>{correctCount}</span>/3</p>
            </div>
            <button className="btn btn-secondary" onClick={playResult}>🔊 播放结果</button>
          </div>
          <button className="btn btn-primary btn-large" onClick={startGame}>
            🔄 再听一个新故事
          </button>
        </div>
      )}

      {/* 加载遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      )}

      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .container { max-width: 480px; margin: 0 auto; padding: 20px; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; background: #f5f7fa; }
        header { text-align: center; margin-bottom: 24px; }
        header h1 { font-size: 24px; color: #4A90D9; margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: #666; }
        .screen { display: flex; flex-direction: column; gap: 20px; }
        .welcome-card, .story-card, .question-card, .result-card, .history-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: #4A90D9; color: white; }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-large { padding: 18px 32px; font-size: 18px; }
        .options-container { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
        .option-btn { width: 120px; height: 80px; border: 3px solid #4A90D9; border-radius: 16px; background: white; color: #4A90D9; font-size: 20px; font-weight: bold; cursor: pointer; }
        .option-btn.selected { background: #4A90D9; color: white; }
        .option-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .record-hint { text-align: center; color: #666; font-size: 14px; margin-top: 12px; }
        .welcome-card { text-align: center; }
        .welcome-card .icon { font-size: 64px; margin-bottom: 16px; }
        .welcome-card h2 { font-size: 22px; margin-bottom: 12px; }
        .welcome-card p { color: #666; margin-bottom: 24px; }
        .history-card { margin-top: 20px; }
        .history-card h3 { font-size: 16px; margin-bottom: 12px; color: #666; }
        .history-item { display: flex; justify-content: space-between; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px; margin-bottom: 8px; }
        .history-item .score { font-weight: bold; color: #4A90D9; }
        .history-item .date { color: #666; font-size: 12px; }
        .empty { color: #666; font-size: 14px; text-align: center; padding: 12px; }
        .story-card h2 { font-size: 18px; margin-bottom: 16px; color: #4A90D9; }
        .story-text { font-size: 17px; line-height: 1.8; background: #f8f9fa; padding: 16px; border-radius: 12px; min-height: 120px; margin-bottom: 16px; }
        .audio-controls { display: flex; justify-content: center; }
        .question-card { text-align: center; }
        .question-header { margin-bottom: 16px; }
        .question-number { display: inline-block; background: #4A90D9; color: white; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .question-text { font-size: 20px; margin-bottom: 10px; }
        .answer-display { background: #f0f7ff; padding: 12px 16px; border-radius: 8px; margin-top: 16px; }
        .answer-display span { font-weight: 600; color: #4A90D9; }
        .question-nav { margin-top: 16px; }
        .result-card { text-align: center; }
        .score-circle { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, #4A90D9, #6BA3E0); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; }
        .score-circle span:first-child { font-size: 56px; font-weight: bold; }
        .score-circle .score-label { font-size: 16px; opacity: 0.9; }
        .result-card h2 { font-size: 24px; margin-bottom: 12px; }
        .result-details { color: #666; margin: 16px 0 24px; }
        .result-details span { font-weight: bold; color: #4A90D9; }
        .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; }
        .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid #4A90D9; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loading-overlay p { margin-top: 16px; color: #666; }
      `}</style>
    </div>
  );
}
