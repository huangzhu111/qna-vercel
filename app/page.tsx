<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>记忆故事问答</title>
    <style>{`
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
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            line-height: 1.6;
        }
        .container { max-width: 480px; margin: 0 auto; padding: 20px; min-height: 100vh; }
        header { text-align: center; margin-bottom: 24px; }
        header h1 { font-size: 24px; color: var(--primary); margin-bottom: 8px; }
        .subtitle { font-size: 14px; color: var(--text-light); }
        .screen { display: none; }
        .screen.active { display: flex; flex-direction: column; gap: 20px; }
        .card, .welcome-card, .story-card, .question-card, .result-card, .history-card {
            background: var(--card-bg);
            border-radius: var(--radius);
            padding: 24px;
            box-shadow: var(--shadow);
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 14px 28px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-primary:active { background: var(--primary-dark); transform: scale(0.98); }
        .btn-secondary { background: #f0f0f0; color: var(--text); }
        .btn-large { padding: 18px 32px; font-size: 18px; }
        .options-container { display: flex; gap: 20px; justify-content: center; margin: 30px 0; }
        .option-btn {
            width: 120px; height: 80px; border: 3px solid var(--primary);
            border-radius: 16px; background: white; color: var(--primary);
            font-size: 32px; font-weight: bold; cursor: pointer; transition: all 0.2s ease;
        }
        .option-btn:active { background: var(--primary); color: white; transform: scale(0.95); }
        .option-btn.selected { background: var(--primary); color: white; }
        .record-hint { text-align: center; color: var(--text-light); font-size: 14px; margin-top: 12px; }
        .welcome-card { text-align: center; }
        .welcome-card .icon { font-size: 64px; margin-bottom: 16px; }
        .welcome-card h2 { font-size: 22px; margin-bottom: 12px; }
        .welcome-card p { color: var(--text-light); margin-bottom: 24px; }
        .history-card { margin-top: 20px; }
        .history-card h3 { font-size: 16px; margin-bottom: 12px; color: var(--text-light); }
        #history-list { display: flex; flex-direction: column; gap: 8px; }
        .history-item { display: flex; justify-content: space-between; padding: 10px 12px; background: #f8f9fa; border-radius: 8px; font-size: 14px; }
        .history-item .score { font-weight: bold; color: var(--primary); }
        .history-item .date { color: var(--text-light); font-size: 12px; }
        .empty { color: var(--text-light); font-size: 14px; text-align: center; padding: 12px; }
        .story-card h2 { font-size: 18px; margin-bottom: 16px; color: var(--primary); }
        .story-text { font-size: 17px; line-height: 1.8; color: var(--text); background: #f8f9fa; padding: 16px; border-radius: 12px; min-height: 120px; margin-bottom: 16px; }
        .story-text .loading { color: var(--text-light); text-align: center; }
        .audio-controls { display: flex; justify-content: center; }
        .question-card { text-align: center; }
        .question-header { margin-bottom: 16px; }
        .question-number { display: inline-block; background: var(--primary); color: white; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .question-text { font-size: 20px; margin-bottom: 10px; min-height: 60px; display: flex; align-items: center; justify-content: center; }
        .answer-display { background: #f0f7ff; padding: 12px 16px; border-radius: 8px; margin-top: 16px; }
        .answer-display.hidden { display: none; }
        .answer-display span { font-weight: 600; color: var(--primary); }
        .question-nav { margin-top: 16px; }
        .result-card { text-align: center; }
        .score-circle { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #6BA3E0); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; box-shadow: 0 8px 24px rgba(74, 144, 217, 0.4); }
        .score-circle #score { font-size: 56px; font-weight: bold; line-height: 1; }
        .score-circle .score-label { font-size: 16px; opacity: 0.9; }
        .result-card h2 { font-size: 24px; margin-bottom: 12px; }
        .result-details { color: var(--text-light); margin: 16px 0 24px; }
        .result-details span { font-weight: bold; color: var(--primary); }
        .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; }
        .loading-overlay.hidden { display: none; }
        .spinner { width: 48px; height: 48px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .loading-overlay p { margin-top: 16px; color: var(--text-light); }
        .hidden { display: none !important; }
        @media (max-width: 380px) {
            .container { padding: 16px; }
            .btn-large { padding: 16px 24px; font-size: 16px; }
            .option-btn { width: 100px; height: 70px; font-size: 28px; }
        }
    `}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧠 记忆故事问答</h1>
            <p class="subtitle">每天练习一小步，记忆力棒棒的！</p>
        </header>

        <main id="app">
            <section id="start-screen" class="screen active">
                <div class="welcome-card">
                    <div class="icon">📖</div>
                    <h2>欢迎来听故事！</h2>
                    <p>点击下方按钮，我会给你讲一个小故事，然后问你几个问题。</p>
                    <button id="start-btn" class="btn btn-primary btn-large">▶️ 开始听故事</button>
                </div>
                <div class="history-card">
                    <h3>📊 历史记录</h3>
                    <div id="history-list"><p class="empty">暂无记录</p></div>
                </div>
            </section>

            <section id="story-screen" class="screen">
                <div class="story-card">
                    <h2>📝 故事内容</h2>
                    <div id="story-content" class="story-text"><p class="loading">正在生成故事...</p></div>
                    <div class="audio-controls">
                        <button id="play-story-btn" class="btn btn-secondary">🔊 播放故事</button>
                    </div>
                </div>
                <button id="to-questions-btn" class="btn btn-primary btn-large">听完了，去答题 →</button>
            </section>

            <section id="questions-screen" class="screen">
                <div class="question-card">
                    <div class="question-header">
                        <span class="question-number">问题 <span id="q-num">1</span>/3</span>
                    </div>
                    <h2 id="question-text" class="question-text">问题内容</h2>
                    <div class="options-container">
                        <button class="option-btn" data-option="A">A</button>
                        <button class="option-btn" data-option="B">B</button>
                    </div>
                    <p class="record-hint">点击 A 或 B 选择答案</p>
                    <div id="answer-display" class="answer-display hidden">
                        <p>你的选择：<span id="answer-text">...</span></p>
                    </div>
                </div>
                <div class="question-nav">
                    <button id="next-q-btn" class="btn btn-primary btn-large" disabled>下一题 →</button>
                </div>
            </section>

            <section id="result-screen" class="screen">
                <div class="result-card">
                    <div class="score-circle">
                        <span id="score">0</span>
                        <span class="score-label">分</span>
                    </div>
                    <h2 id="result-message">太棒了！</h2>
                    <div class="result-details">
                        <p>回答正确：<span id="correct-count">0</span>/3</p>
                    </div>
                    <button id="play-result-btn" class="btn btn-secondary">🔊 播放结果</button>
                </div>
                <button id="restart-btn" class="btn btn-primary btn-large">🔄 再听一个新故事</button>
            </section>

            <div id="loading-overlay" class="loading-overlay hidden">
                <div class="spinner"></div>
                <p id="loading-text">加载中...</p>
            </div>
        </main>
    </div>

    <script>{`
        const state = { currentScreen: 'start-screen', story: '', questions: [], currentQuestion: 0, answers: [], correctCount: 0, selectedOption: null };
        const elements = {
            screens: document.querySelectorAll('.screen'),
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.getElementById('loading-text'),
            startBtn: document.getElementById('start-btn'),
            historyList: document.getElementById('history-list'),
            storyContent: document.getElementById('story-content'),
            playStoryBtn: document.getElementById('play-story-btn'),
            toQuestionsBtn: document.getElementById('to-questions-btn'),
            qNum: document.getElementById('q-num'),
            questionText: document.getElementById('question-text'),
            optionBtns: document.querySelectorAll('.option-btn'),
            answerDisplay: document.getElementById('answer-display'),
            answerText: document.getElementById('answer-text'),
            nextQBtn: document.getElementById('next-q-btn'),
            score: document.getElementById('score'),
            resultMessage: document.getElementById('result-message'),
            correctCount: document.getElementById('correct-count'),
            playResultBtn: document.getElementById('play-result-btn'),
            restartBtn: document.getElementById('restart-btn')
        };

        function init() { loadHistory(); setupEventListeners(); }
        function setupEventListeners() {
            elements.startBtn.addEventListener('click', startGame);
            elements.playStoryBtn.addEventListener('click', playStory);
            elements.toQuestionsBtn.addEventListener('click', goToQuestions);
            elements.optionBtns.forEach(btn => btn.addEventListener('click', () => selectOption(btn.dataset.option)));
            elements.nextQBtn.addEventListener('click', nextQuestion);
            elements.playResultBtn.addEventListener('click', playResult);
            elements.restartBtn.addEventListener('click', startGame);
        }
        function showScreen(screenId) {
            state.currentScreen = screenId;
            elements.screens.forEach(screen => screen.classList.toggle('active', screen.id === screenId));
        }
        function showLoading(text = '加载中...') { elements.loadingText.textContent = text; elements.loadingOverlay.classList.remove('hidden'); }
        function hideLoading() { elements.loadingOverlay.classList.add('hidden'); }

        async function startGame() {
            showLoading('正在生成故事...');
            try {
                const res = await fetch('/api/story');
                const data = await res.json();
                if (!data.story) throw new Error('生成失败');
                state.story = data.story;
                state.questions = data.questions;
                state.currentQuestion = 0;
                state.answers = [];
                state.correctCount = 0;
                elements.storyContent.innerHTML = '<p>' + data.story + '</p>';
                elements.playStoryBtn.textContent = '🔊 播放故事';
                elements.playStoryBtn.disabled = false;
                showScreen('story-screen');
            } catch (error) {
                alert('生成故事失败，请重试: ' + error.message);
            } finally { hideLoading(); }
        }

        async function playStory() {
            showLoading('正在播放...');
            elements.playStoryBtn.disabled = true;
            try {
                const res = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: state.story })
                });
                const data = await res.json();
                if (data.audioUrl) {
                    const audio = new Audio(data.audioUrl);
                    audio.onended = () => { elements.playStoryBtn.textContent = '🔊 重新播放'; elements.playStoryBtn.disabled = false; };
                    await audio.play();
                } else if (window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(state.story);
                    utterance.lang = 'zh-CN'; utterance.rate = 0.85;
                    utterance.onend = () => { elements.playStoryBtn.textContent = '🔊 重新播放'; elements.playStoryBtn.disabled = false; };
                    window.speechSynthesis.speak(utterance);
                }
            } catch (error) {
                // 备用：浏览器语音
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(state.story);
                utterance.lang = 'zh-CN'; utterance.rate = 0.85;
                utterance.onend = () => { elements.playStoryBtn.textContent = '🔊 重新播放'; elements.playStoryBtn.disabled = false; };
                window.speechSynthesis.speak(utterance);
            } finally { hideLoading(); }
        }

        function goToQuestions() { state.currentQuestion = 0; showQuestion(); showScreen('questions-screen'); }
        function showQuestion() {
            const q = state.questions[state.currentQuestion];
            elements.qNum.textContent = state.currentQuestion + 1;
            elements.questionText.textContent = q.question;
            if (q.options && q.options.length >= 2) {
                elements.optionBtns[0].textContent = q.options[0];
                elements.optionBtns[1].textContent = q.options[1];
            }
            elements.optionBtns.forEach(btn => btn.classList.remove('selected'));
            state.selectedOption = null;
            elements.answerDisplay.classList.add('hidden');
            elements.nextQBtn.disabled = true;
            elements.nextQBtn.textContent = state.currentQuestion === 2 ? '查看结果' : '下一题 →';
        }
        function selectOption(option) {
            if (state.selectedOption) return;
            state.selectedOption = option;
            elements.optionBtns.forEach(btn => { if (btn.dataset.option === option) btn.classList.add('selected'); });
            const q = state.questions[state.currentQuestion];
            const optionText = q.options[option === 'A' ? 0 : 1];
            elements.answerText.textContent = optionText;
            elements.answerDisplay.classList.remove('hidden');
            const isCorrect = option === q.answer;
            if (isCorrect) state.correctCount++;
            state.answers.push({ question: q.question, selected: option, correct: q.answer, isCorrect: isCorrect });
            elements.nextQBtn.disabled = false;
        }
        function nextQuestion() {
            state.currentQuestion++;
            if (state.currentQuestion >= state.questions.length) showResult();
            else showQuestion();
        }
        async function showResult() {
            const score = Math.round((state.correctCount / 3) * 100);
            state.score = score;
            elements.score.textContent = score;
            elements.correctCount.textContent = state.correctCount + '/3';
            if (score >= 100) elements.resultMessage.textContent = '太棒了！全部答对！🎉';
            else if (score >= 66) elements.resultMessage.textContent = '很不错哦！继续加油！💪';
            else if (score >= 33) elements.resultMessage.textContent = '加油！多练习会更好！🌟';
            else elements.resultMessage.textContent = '别灰心，慢慢来！❤️';
            saveHistory(score);
            showScreen('result-screen');
        }
        async function playResult() {
            let message = '';
            const s = state.score;
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
            } catch (e) { window.speechSynthesis.speak(new SpeechSynthesisUtterance(message)); }
        }
        function loadHistory() { try { const h = JSON.parse(localStorage.getItem('qna-history') || '[]'); renderHistory(h); } catch (e) {} }
        function saveHistory(score) { try { const h = JSON.parse(localStorage.getItem('qna-history') || '[]'); h.unshift({ score, date: new Date().toLocaleDateString('zh-CN') }); h.splice(10); localStorage.setItem('qna-history', JSON.stringify(h)); renderHistory(h); } catch (e) {} }
        function renderHistory(h) {
            if (!h || h.length === 0) { elements.historyList.innerHTML = '<p class="empty">暂无记录</p>'; return; }
            elements.historyList.innerHTML = h.map(item => '<div class="history-item"><span class="date">' + item.date + '</span><span class="score">' + item.score + '分</span></div>').join('');
        }
        init();
    `}</script>
</body>
</html>
