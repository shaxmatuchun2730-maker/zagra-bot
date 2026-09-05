document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    // Telegramdan o'yinchining haqiqiy xalqaro ismi va unikal ID raqamini aniqlash
    let user_id = tg?.initDataUnsafe?.user?.id || "guest_" + Math.floor(Math.random() * 1000);
    let user_name = tg?.initDataUnsafe?.user?.first_name || tg?.initDataUnsafe?.user?.username || "Cyber_Pilot";

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;

    // TEPADA GOOGLE FIREBASE'DAN OLGAN SHAXSIY LINKINGIZNI SHU YERGA QO'YING!
    const FIREBASE_DB_URL = "https://firebaseio.com"; 

    const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

    // O'yin ochilishi bilan ushbu o'yinchining eski ballarini Google bazasidan yuklab olish
    fetch(`${FIREBASE_DB_URL}/players/${user_id}.json`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                score = data.score || 0;
                perfects = data.perfects || 0;
                if (scoreVal) scoreVal.innerText = score;
                if (perfectVal) perfectVal.innerText = perfects;
            }
        });

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
                let addedScore = 0, isPerfect = 0;

                if (finalTime === 1.000) {
                    perfects++; addedScore = 10; isPerfect = 1;
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

                // YANGILANGAN BALLARNI GOOGLE BULUTIGA ABADIY MUHRLASH
                fetch(`${FIREBASE_DB_URL}/players/${user_id}.json`, {
                    method: 'PATCH',
                    body: JSON.stringify({ name: user_name, score: score, perfects: perfects })
                });
            }
        });
    }

    // 2 XIL REAL REYTINGNI GOOGLE BAZASIDAN ONLAYN TORTIB SARALASH ALGORITMI
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

        fetch(`${FIREBASE_DB_URL}/players.json`)
            .then(res => res.json())
            .then(data => {
                listEl.innerHTML = '';
                if (!data) { listEl.innerHTML = '<li style="padding:15px; color:#556375;">No pilots registered yet.</li>'; return; }

                // Ma'lumotlarni massivga o'tkazish
                let playersArray = Object.keys(data).map(key => ({
                    id: key,
                    name: data[key].name || "Anonymous Pilot",
                    score: data[key].score || 0,
                    perfects: data[key].perfects || 0
                }));

                // Siz aytganidek 2 xil reyting bo'yicha onlayn saralash (Dasturchilik saralashi)
                if (type === 'perfects') {
                    playersArray.sort((a, b) => b.perfects - a.perfects);
                } else {
                    playersArray.sort((a, b) => b.score - a.score);
                }

                playersArray.forEach((p, i) => {
                    let li = document.createElement('li'); li.className = 'leaderboard-item';
                    let displayVal = type === 'perfects' ? p.perfects + " Kings" : p.score + " Scores";
                    
                    // Agar o'yinchi o'zi bo'lsa uni alohida neon rang bilan ajratib ko'rsatish
                    let isMeStyle = p.id == user_id ? "color:#fff; text-shadow:0 0 10px #00f0ff; font-weight:bold;" : "";
                    
                    li.innerHTML = `<span class="rank">#${i+1}</span><span style="${isMeStyle}">${p.name}</span><strong style="${type==='perfects'?'color:#00f0ff;':'color:#ff007f;'}">${displayVal}</strong>`;
                    listEl.appendChild(li);
                });

                // Dunyo bo'yicha mutloq o'rinni hisoblash
                let myRankPosition = playersArray.findIndex(p => p.id == user_id) + 1;
                document.getElementById('my-rank').innerText = `Your Absolute Global Position: Top-${myRankPosition || playersArray.length}`;
            });
    }
});
