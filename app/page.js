'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [state, setState] = useState({
    currentScreen: 'start-screen',
    story: '',
    questions: [],
    currentQuestion: 0,
    answers: [],
    correctCount: 0,
    selectedOption: null
  });

  const [elements, setElements] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('加载中...');

  useEffect(() => {
    // 在客户端初始化
    setState(prev => ({
      ...prev,
      ...loadHistory()
    }));
  }, []);

  function loadHistory() {
    try {
      return { history: JSON.parse(localStorage.getItem('qna-history') || '[]') };
    } catch {
      return { history: [] };
    }
  }

  function showScreen(screenId) {
    setState(prev => ({ ...prev, currentScreen: screenId }));
  }

  function showLoading(text = '加载中...') {
    setLoadingText(text);
    setLoading(true);
  }

  function hideLoading() {
    setLoading(false);
  }

  async function startGame() {
    showLoading('正在生成故事...');
    try {
      const res = await fetch('/api/story', { method: 'POST' });
      const data = await res.json();
      if (!data.story) throw new Error('生成失败');
      setState(prev => ({
        ...prev,
        story: data.story,
        questions: data.questions,
        currentQuestion: 0,
        answers: [],
        correctCount: 0
      }));
      showScreen('story-screen');
    } catch (error) {
      alert('生成故事失败，请重试: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  async function playStory() {
    showLoading('正在播放...');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: state.story })
      });
      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        await audio.play();
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(state.story);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        await new Promise(resolve => {
          utterance.onend = resolve;
          window.speechSynthesis.speak(utterance);
        });
      }
    } catch (error) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(state.story);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } finally {
      hideLoading();
    }
  }

  function goToQuestions() {
    setState(prev => ({ ...prev, currentQuestion: 0 }));
    showScreen('questions-screen');
  }

  function selectOption(option) {
    if (state.selectedOption) return;
    
    const q = state.questions[state.currentQuestion];
    const isCorrect = option === q.answer;
    
    setState(prev => ({
      ...prev,
      selectedOption: option,
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      answers: [...prev.answers, {
        question: q.question,
        selected: option,
        correct: q.answer,
        isCorrect
      }]
    }));
  }

  function nextQuestion() {
    if (state.currentQuestion >= state.questions.length - 1) {
      showResult();
    } else {
      setState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        selectedOption: null
      }));
    }
  }

  function showResult() {
    const score = Math.round((state.correctCount / 3) * 100);
    setState(prev => ({ ...prev, score }));
    
    // 保存历史
    try {
      const history = JSON.parse(localStorage.getItem('qna-history') || '[]');
      history.unshift({ score, date: new Date().toLocaleDateString('zh-CN') });
      history.splice(10);
      localStorage.setItem('qna-history', JSON.stringify(history));
    } catch {}
    
    showScreen('result-screen');
  }

  async function playResult() {
    let message = '';
    const s = state.score || state.correctCount;
    if (s >= 100) message = '太棒了！你全部答对！';
    else if (s >= 66) message = '很不错哦！你答对了' + state.correctCount + '道题，继续加油！';
    else if (s >= 33) message = '加油！你答对了' + state.correctCount + '道题，多练习会更好的！';
    else message = '别灰心，慢慢来！你答对了' + state.correctCount + '道题。';
    
    try {
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
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
    }
  }

  const currentQuestion = state.questions[state.currentQuestion];

  return (
    <div className="container">
      <header>
        <h1>🧠 记忆故事问答</h1>
        <p className="subtitle">每天练习一小步，记忆力棒棒的！</p>
      </header>

      {/* 开始界面 */}
      {state.currentScreen === 'start-screen' && (
        <section className="screen active">
          <div className="welcome-card">
            <div className="icon">📖</div>
            <h2>欢迎来听故事！</h2>
            <p>点击下方按钮，我会给你讲一个小故事，然后问你几个问题。</p>
            <button className="btn btn-primary btn-large" onClick={startGame}>▶️ 开始听故事</button>
          </div>
          <div className="history-card">
            <h3>📊 历史记录</h3>
            <div id="history-list">
              {(loadHistory().history || []).length === 0 ? (
                <p className="empty">暂无记录</p>
              ) : (
                loadHistory().history.map((item, i) => (
                  <div key={i} className="history-item">
                    <span className="date">{item.date}</span>
                    <span className="score">{item.score}分</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* 故事界面 */}
      {state.currentScreen === 'story-screen' && (
        <section className="screen">
          <div className="story-card">
            <h2>📝 故事内容</h2>
            <div className="story-text">
              <p>{state.story}</p>
            </div>
            <div className="audio-controls">
              <button className="btn btn-secondary" onClick={playStory}>🔊 播放故事</button>
            </div>
          </div>
          <button className="btn btn-primary btn-large" onClick={goToQuestions}>听完了，去答题 →</button>
        </section>
      )}

      {/* 答题界面 */}
      {state.currentScreen === 'questions-screen' && currentQuestion && (
        <section className="screen">
          <div className="question-card">
            <div className="question-header">
              <span className="question-number">问题 {state.currentQuestion + 1}/3</span>
            </div>
            <h2 className="question-text">{currentQuestion.question}</h2>
            <div className="options-container">
              <button 
                className={`option-btn ${state.selectedOption === 'A' ? 'selected' : ''}`}
                onClick={() => selectOption('A')}
              >
                {currentQuestion.options?.[0] || 'A'}
              </button>
              <button 
                className={`option-btn ${state.selectedOption === 'B' ? 'selected' : ''}`}
                onClick={() => selectOption('B')}
              >
                {currentQuestion.options?.[1] || 'B'}
              </button>
            </div>
            <p className="record-hint">点击 A 或 B 选择答案</p>
            {state.selectedOption && (
              <div className="answer-display">
                <p>你的选择：{currentQuestion.options?.[state.selectedOption === 'A' ? 0 : 1]}</p>
              </div>
            )}
          </div>
          <div className="question-nav">
            <button 
              className="btn btn-primary btn-large" 
              disabled={!state.selectedOption}
              onClick={nextQuestion}
            >
              {state.currentQuestion >= 2 ? '查看结果' : '下一题 →'}
            </button>
          </div>
        </section>
      )}

      {/* 结果界面 */}
      {state.currentScreen === 'result-screen' && (
        <section className="screen">
          <div className="result-card">
            <div className="score-circle">
              <span>{Math.round((state.correctCount / 3) * 100)}</span>
              <span className="score-label">分</span>
            </div>
            <h2>
              {state.correctCount === 3 ? '太棒了！全部答对！🎉' :
               state.correctCount >= 2 ? '很不错哦！继续加油！💪' :
               state.correctCount >= 1 ? '加油！多练习会更好！🌟' :
               '别灰心，慢慢来！❤️'}
            </h2>
            <div className="result-details">
              <p>回答正确：<span>{state.correctCount}</span>/3</p>
            </div>
            <button className="btn btn-secondary" onClick={playResult}>🔊 播放结果</button>
          </div>
          <button className="btn btn-primary btn-large" onClick={startGame}>🔄 再听一个新故事</button>
        </section>
      )}

      {/* 加载遮罩 */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>{loadingText}</p>
        </div>
      )}

      <style jsx>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --primary: #4A90D9;
          --primary-dark: #3A7BC8;
          --text: #333;
          --text-light: #666;
          --bg: #f5f7fa;
          --card-bg: #fff;
          --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          --radius: 16px;
        }
        .container { max-width: 480px; margin: 0 auto; padding: 20px; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
        header { text-align: center; margin-bottom: 24px; }
        header h1 { font-size: 24px; color: var(--primary); margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: var(--text-light); }
        .screen { display: none; flex-direction: column; gap: 20px; }
        .screen.active { display: flex; }
        .welcome-card, .story-card, .question-card, .result-card, .history-card { background: var(--card-bg); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; width: 100%; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:active { background: var(--primary-dark); transform: scale(0.98); }
        .btn-secondary { background: #f0f0f0; color: var(--text); }
        .btn-large { padding: 18px 32px; font-size: 18px; }
        .options-container { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
        .option-btn { width: 120px; height: 80px; border: 3px solid var(--primary); border-radius: 16px; background: white; color: var(--primary); font-size: 24px; font-weight: bold; cursor: pointer; }
        .option-btn.selected { background: var(--primary); color: white; }
        .record-hint { text-align: center; color: var(--text-light); font-size: 14px; margin-top: 12px; }
        .welcome-card { text-align: center; }
        .welcome-card .icon { font-size: 64px; margin-bottom: 16px; }
        .welcome-card h2 { font-size: 22px; margin-bottom: 12px; }
        .welcome-card p { color: var(--text-light); margin-bottom: 24px; }
        .history-card { margin-top: 20px; }
        .history-card h3 { font-size: 16px; margin-bottom: 12px; color: var(--text-light); }
        .history-item { display: flex; justify-content: space-between; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        .history-item .score { font-weight: bold; color: var(--primary); }
        .history-item .date { color: var(--text-light); font-size: 12px; }
        .empty { color: var(--text-light); font-size: 14px; text-align: center; padding: 12px; }
        .story-card h2 { font-size: 18px; margin-bottom: 16px; color: var(--primary); }
        .story-text { font-size: 17px; line-height: 1.8; background: #f8f9fa; padding: 16px; border-radius: 12px; min-height: 120px; margin-bottom: 16px; }
        .audio-controls { display: flex; justify-content: center; }
        .question-card { text-align: center; }
        .question-header { margin-bottom: 16px; }
        .question-number { display: inline-block; background: var(--primary); color: white; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .question-text { font-size: 20px; margin-bottom: 10px; min-height: 60px; }
        .answer-display { background: #f0f7ff; padding: 12px 16px; border-radius: 8px; margin-top: 16px; }
        .answer-display span { font-weight: 600; color: var(--primary); }
        .question-nav { margin-top: 16px; }
        .result-card { text-align: center; }
        .score-circle { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #6BA3E0); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; box-shadow: 0 8px 24px rgba(74, 144, 217, 0.4); }
        .score-circle span:first-child { font-size: 56px; font-weight: bold; }
        .score-circle .score-label { font-size: 16px; opacity: 0.9; }
        .result-card h2 { font-size: 24px; margin-bottom: 12px; }
        .result-details { color: var(--text-light); margin: 16px 0 24px; }
        .result-details span { font-weight: bold; color: var(--primary); }
        .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; }
        .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loading-overlay p { margin-top: 16px; color: var(--text-light); }
      `}</style>
    </div>
  );
}
