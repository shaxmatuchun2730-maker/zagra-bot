document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    // Telegram foydalanuvchi ma'lumotlari (Xavfsiz zaxira bilan)
    let user_id = tg?.initDataUnsafe?.user?.id || "guest_" + Math.floor(Math.random() * 1000);
    let user_name = tg?.initDataUnsafe?.user?.first_name || tg?.initDataUnsafe?.user?.username || "Cyber_Pilot";

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;

    // Google Firebase REST API manzili
    const FIREBASE_REST_URL = "https://firebaseio.com";

    const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

    // 1. O'yin ochilishi bilan o'yinchining eski ballarini Google bulutidan toza JSON orqali yuklab olish
    fetch(`${FIREBASE_REST_URL}/players/${user_id}.json`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                score = data.score || 0;
                perfects = data.perfects || 0;
                if (scoreVal) scoreVal.innerText = score;
                if (perfectVal) perfectVal.innerText = perfects;
            }
        }).catch(err => console.log("Cloud sync error:", err));

    function updateTimer() {
        let elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= 1.5) startTime = performance.now();
        timerEl.innerText = elapsed.toFixed(3);
    }

    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            if (!isRunning) {
                isRunning = true; actionBtn.innerText = "STOP";
                actionBtn.style.background = "linear-gradient(90deg, #00f0ff, #0072ff)";
                feedbackEl.innerText = "FOCUS NOW..."; startTime = performance.now();
                timerInterval = setInterval(updateTimer, 1);
            } else {
                isRunning = false; clearInterval(timerInterval);
                actionBtn.innerText = "START";
                actionBtn.style.background = "linear-gradient(90deg, #ff007f, #7f00ff)";
                
                let finalTime = parseFloat(timerEl.innerText);
                let addedScore = 0;

                if (finalTime === 1.000) {
                    perfects++; addedScore = 10;
                    if (perfectVal) perfectVal.innerText = perfects;
                    feedbackEl.innerText = "🎯 PERFECT HIT! +10"; feedbackEl.style.color = "#00f0ff";
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                } else if (finalTime >= 0.990 && finalTime <= 1.010) {
                    addedScore = 1;
                    feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; feedbackEl.style.color = "#0072ff";
                } else {
                    feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; feedbackEl.style.color = "#ff007f";
                }
                score += addedScore; 
                if (scoreVal) scoreVal.innerText = score;

                // 2. BALLAR DEPOSITINI GOOGLE FIREBASE JAVONIGA PUT REQ BILAN INTEGRATSIYA QILISH
                fetch(`${FIREBASE_REST_URL}/players/${user_id}.json`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: user_name, score: score, perfects: perfects })
                });
            }
        });
    }

    // 3. JONLI REYTINGNI SARALASH (2 XIL REYTING)
    const tabGame = document.getElementById('tab-game'), tabRank = document.getElementById('tab-rank');
    const gameView = document.getElementById('game-view'), rankView = document.getElementById('rank-view');
    const subPerfects = document.getElementById('sub-perfects'), subScores = document.getElementById('sub-scores');

    if (tabGame && tabRank) {
        tabGame.addEventListener('click', () => {
            tabGame.classList.add('active'); tabRank.classList.remove('active');
            if (gameView) gameView.style.display = 'flex'; if (rankView) rankView.style.display = 'none';
        });
        tabRank.addEventListener('click', () => {
            tabRank.classList.add('active'); tabGame.classList.remove('active');
            if (gameView) gameView.style.display = 'none'; if (rankView) rankView.style.display = 'flex';
            loadLiveLeaderboard('perfects');
        });
    }

    if (subPerfects && subScores) {
        subPerfects.addEventListener('click', () => { subPerfects.classList.add('active'); subScores.classList.remove('active'); loadLiveLeaderboard('perfects'); });
        subScores.addEventListener('click', () => { subScores.classList.add('active'); subPerfects.classList.remove('active'); loadLiveLeaderboard('scores'); });
    }

    function loadLiveLeaderboard(type) {
        const listEl = document.getElementById('leaderboard');
        if (!listEl) return;
        listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#556375;">Syncing live global data...</li>';

        fetch(`${FIREBASE_REST_URL}/players.json`)
            .then(res => res.json())
            .then(data => {
                listEl.innerHTML = '';
                if (!data) { listEl.innerHTML = '<li style="padding:15px; color:#556375;">No pilots registered yet.</li>'; return; }

                let playersArray = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].name || "Anonymous Pilot",
                    score: data[key].score || 0,
                    perfects: data[key].perfects || 0
                }));

                // 2 xil saralash algoritmi
                if (type === 'perfects') {
                    playersArray.sort((a, b) => b.perfects - a.perfects);
                } else {
                    playersArray.sort((a, b) => b.score - a.score);
                }

                playersArray.forEach((p, i) => {
                    let li = document.createElement('li'); li.className = 'leaderboard-item';
                    let displayVal = type === 'perfects' ? p.perfects + " Kings" : p.score + " Scores";
                    let isMeStyle = p.id == user_id ? "color:#fff; text-shadow:0 0 10px #00f0ff; font-weight:bold;" : "";
                    
                    li.innerHTML = `<span class="rank">#${i+1}</span><span style="${isMeStyle}">${p.name}</span><strong style="${type==='perfects'?'color:#00f0ff;':'color:#ff007f;'}">${displayVal}</strong>`;
                    listEl.appendChild(li);
                });

                let myRankPosition = playersArray.findIndex(p => p.id == user_id) + 1;
                document.getElementById('my-rank').innerText = `Your Absolute Global Position: Top-${myRankPosition || playersArray.length}`;
            }).catch(err => {
                listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#ff007f;">Connection timeout! Try again.</li>';
            });
    }
});
