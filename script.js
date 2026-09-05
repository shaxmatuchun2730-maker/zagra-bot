document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;
    let user_id = tg?.initDataUnsafe?.user?.id || 0;

    const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

    function updateTimer() {
        let elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= 1.5) startTime = performance.now();
        timerEl.innerText = elapsed.toFixed(3);
    }

    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            if (!isRunning) {
                isRunning = true; 
                actionBtn.innerText = "STOP";
                actionBtn.style.background = "linear-gradient(90deg, #00f0ff, #0072ff)";
                actionBtn.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.5)";
                feedbackEl.innerText = "FOCUS NOW..."; 
                startTime = performance.now();
                timerInterval = setInterval(updateTimer, 1);
            } else {
                isRunning = false; 
                clearInterval(timerInterval);
                actionBtn.innerText = "START";
                actionBtn.style.background = "linear-gradient(90deg, #ff007f, #7f00ff)";
                actionBtn.style.boxShadow = "0 0 30px rgba(255, 0, 127, 0.45)";
                
                let finalTime = parseFloat(timerEl.innerText);
                let addedScore = 0;

                if (finalTime === 1.000) {
                    perfects++; addedScore = 10;
                    perfectVal.innerText = perfects;
                    feedbackEl.innerText = "🎯 PERFECT HIT! +10"; 
                    feedbackEl.style.color = "#00f0ff";
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                } else if (finalTime >= 0.990 && finalTime <= 1.010) {
                    addedScore = 1;
                    feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; 
                    feedbackEl.style.color = "#0072ff";
                } else {
                    feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; 
                    feedbackEl.style.color = "#ff007f";
                }
                score += addedScore; 
                scoreVal.innerText = score;

                // Eng asosiysi: Ballar yig'ilganda Python bot orqali Telegram bazasiga yuboriladi
                if (addedScore > 0 && tg) {
                    tg.sendData(JSON.stringify({ score: score, perfects: perfects }));
                }
            }
        });
    }

    // Navigatsiya Boshqaruvi
    const tabGame = document.getElementById('tab-game');
    const tabRank = document.getElementById('tab-rank');
    const gameView = document.getElementById('game-view');
    const rankView = document.getElementById('rank-view');

    if (tabGame && tabRank) {
        tabGame.addEventListener('click', () => {
            tabGame.classList.add('active'); tabRank.classList.remove('active');
            gameView.style.display = 'flex'; rankView.style.display = 'none';
        });
        tabRank.addEventListener('click', () => {
            tabRank.classList.add('active'); tabGame.classList.remove('active');
            gameView.style.display = 'none'; rankView.style.display = 'flex';
            
            // Soxta reyting o'chirildi! Foydalanuvchiga bot orqali reytingni ko'rish ko'rsatmasi beriladi
            const listEl = document.getElementById('leaderboard');
            if (listEl) {
                listEl.innerHTML = `
                    <div style="text-align:center; padding:20px; font-size:14px; color:#718096;">
                        📊 Global & Group Leaderboards are actively synced! <br><br>
                        To see the real-time ranking, close this window and use the <b>🏆 Leaderboard</b> button in the bot chat.
                    </div>`;
            }
            document.getElementById('my-rank').innerText = `Your Score Saved Online!`;
        });
    }
});
