// HTML to'liq yuklangandan keyin ishlash kafolati
document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;
    let user_name = tg?.initDataUnsafe?.user?.first_name || "Player";

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

                try {
                    if (tg && tg.initDataUnsafe?.query_id) {
                        tg.sendData(JSON.stringify({ score: score, perfects: perfects }));
                    }
                } catch(e) {
                    console.log("Telegram API Sync skipped");
                }
            }
        });
    }

    // Navigatsiya Tabs
    const tabGame = document.getElementById('tab-game');
    const tabRank = document.getElementById('tab-rank');
    const gameView = document.getElementById('game-view');
    const rankView = document.getElementById('rank-view');
    const subPerfects = document.getElementById('sub-perfects');
    const subScores = document.getElementById('sub-scores');

    if (tabGame && tabRank) {
        tabGame.addEventListener('click', () => toggleTab('game'));
        tabRank.addEventListener('click', () => { toggleTab('rank'); loadMockLeaderboard('perfects'); });
    }

    if (subPerfects && subScores) {
        subPerfects.addEventListener('click', () => { subPerfects.classList.add('active'); subScores.classList.remove('active'); loadMockLeaderboard('perfects'); });
        subScores.addEventListener('click', () => { subScores.classList.add('active'); subPerfects.classList.remove('active'); loadMockLeaderboard('scores'); });
    }

    function toggleTab(type) {
        tabGame.classList.toggle('active', type==='game');
        tabRank.classList.toggle('active', type==='rank');
        gameView.style.display = type==='game' ? 'flex' : 'none';
        rankView.classList.toggle('active', type==='rank');
    }

    function loadMockLeaderboard(type) {
        const listEl = document.getElementById('leaderboard');
        if (!listEl) return;
        listEl.innerHTML = '';
        let data = type === 'perfects' ? 
            [{name: user_name + " (You)", val: perfects + " times"}, {name: "Alex_Pro", val: "4 times"}, {name: "Cyber_King", val: "2 times"}] :
            [{name: user_name + " (You)", val: score + " pts"}, {name: "Alex_Pro", val: "24 pts"}, {name: "Cyber_King", val: "15 pts"}];
        
        data.forEach((p, i) => {
            let li = document.createElement('li'); li.className = 'leaderboard-item';
            li.innerHTML = `<span class="rank">#${i+1}</span><span>${p.name}</span><strong>${p.val}</strong>`;
            listEl.appendChild(li);
        });
        document.getElementById('my-rank').innerText = `Your Rank: Top-1`;
    }
});
