document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    // Telefonda umrbod saqlanadigan xotirani yuklash (Eski ballarni tiklash)
    let score = parseInt(localStorage.getItem("zagra_score") || "0");
    let perfects = parseInt(localStorage.getItem("zagra_perfects") || "0");
    
    let isRunning = false, startTime = 0, timerInterval = null;
    let user_name = tg?.initDataUnsafe?.user?.first_name || "Player";

    const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

    // Sahifa ochilishi bilan eski ballarni ekranga chiqarish (0 bo'lib qolmaydi!)
    if (scoreVal) scoreVal.innerText = score;
    if (perfectVal) perfectVal.innerText = perfects;

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
                    if (perfectVal) perfectVal.innerText = perfects;
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
                if (scoreVal) scoreVal.innerText = score;

                // YANGI BALLARNI TELEFON XOTIRASIGA ABADIY MUHRLASH
                localStorage.setItem("zagra_score", score);
                localStorage.setItem("zagra_perfects", perfects);
            }
        });
    }

    // Navigatsiya Tabs Panel
    const tabGame = document.getElementById('tab-game');
    const tabRank = document.getElementById('tab-rank');
    const gameView = document.getElementById('game-view');
    const rankView = document.getElementById('rank-view');

    if (tabGame && tabRank) {
        tabGame.addEventListener('click', () => {
            tabGame.classList.add('active'); tabRank.classList.remove('active');
            if (gameView) gameView.style.display = 'flex'; 
            if (rankView) rankView.style.display = 'none';
        });
        tabRank.addEventListener('click', () => {
            tabRank.classList.add('active'); tabGame.classList.remove('active');
            if (gameView) gameView.style.display = 'none'; 
            if (rankView) rankView.style.display = 'flex';
            
            // Shaxsiy jonli natijalar jadvali
            const listEl = document.getElementById('leaderboard');
            if (listEl) {
                listEl.innerHTML = `
                    <div class="leaderboard-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 15px 5px;">
                        <span class="rank">#1</span><span>${user_name} (You)</span><strong style="color:#00f0ff;">${perfects} Kings</strong>
                    </div>
                    <div class="leaderboard-item" style="padding: 15px 5px;">
                        <span class="rank">#1</span><span>${user_name} (You)</span><strong style="color:#ff007f;">${score} Scores</strong>
                    </div>
                    <div style="text-align:center; padding:20px; font-size:12px; color:#556375; margin-top:20px;">
                        Your personal best records are securely saved on this device.
                    </div>`;
            }
            const myRankEl = document.getElementById('my-rank');
            if (myRankEl) myRankEl.innerText = `Data Synced Successfully!`;
        });
    }
});
