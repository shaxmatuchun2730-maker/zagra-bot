document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    let user_id = String(tg?.initDataUnsafe?.user?.id || "guest_" + Math.floor(Math.random() * 1000));
    let user_name = tg?.initDataUnsafe?.user?.first_name || tg?.initDataUnsafe?.user?.username || "Cyber_Pilot";

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;

    // TEPADA SUPABASE SETTINGS'DAN OLGAN MA'LUMOTLARINGIZNI SHU YERGA QO'YING!
    const SUPABASE_URL = "https://jgonmawxpwsypvjqtqlt.supabase.co";
    const SUPABASE_KEY = "sb_publishable_10jQxY495GgfBJ-_n2UlJw_ujlhx1Tv";

    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates" // Agar foydalanuvchi bor bo'lsa ma'lumotni yangilaydi (Upsert)
    };

    const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

    // 1. O'yin ochilishi bilan foydalanuvchi ma'lumotlarini PostgreSQL bazasidan yuklab olish
    fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${user_id}`, { headers })
        .then(res => res.json())
        .then(data => {
            if (data && data.length > 0) {
                score = data[0].score || 0;
                perfects = data[0].perfects || 0;
                if (scoreVal) scoreVal.innerText = score;
                if (perfectVal) perfectVal.innerText = perfects;
            }
        }).catch(err => console.log("Database sync skipped"));

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

                // 2. BALLARNI POSTGRESQL BAZASIGA METALLDEK MUSTAHKAM YOZISH (UPSERT REQ)
                fetch(`${SUPABASE_URL}/rest/v1/players`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ id: user_id, name: user_name, score: score, perfects: perfects })
                });
            }
        });
    }

    // 3. JONLI REYTING JADVALINI SQL DARAJASIDA TORTISH (2 XIL REYTING)
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
        listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#556375;">Syncing live global database...</li>';

        // SQL tartibida eng yuqori ballilarni bir qatorda saralab tortish (?order=)
        let orderQuery = type === 'perfects' ? 'perfects.desc' : 'score.desc';
        
        fetch(`${SUPABASE_URL}/rest/v1/players?order=${orderQuery}&limit=100`, {
            method: 'GET',
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        })
        .then(res => res.json())
        .then(data => {
            listEl.innerHTML = '';
            if (!data || data.length === 0) { listEl.innerHTML = '<li style="padding:15px; color:#556375;">No pilots registered yet.</li>'; return; }

            data.forEach((p, i) => {
                let li = document.createElement('li'); li.className = 'leaderboard-item';
                let displayVal = type === 'perfects' ? p.perfects + " Kings" : p.score + " Scores";
                let isMeStyle = p.id == user_id ? "color:#fff; text-shadow:0 0 10px #00f0ff; font-weight:bold;" : "";
                
                li.innerHTML = `<span class="rank">#${i+1}</span><span style="${isMeStyle}">${p.name}</span><strong style="${type==='perfects'?'color:#00f0ff;':'color:#ff007f;'}">${displayVal}</strong>`;
                listEl.appendChild(li);
            });

            let myRankPosition = data.findIndex(p => p.id == user_id) + 1;
            document.getElementById('my-rank').innerText = `Your Absolute Global Position: Top-${myRankPosition === 0 ? "1" : myRankPosition}`;
        }).catch(err => {
            listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#ff007f;">Connection Error. Reset cache.</li>';
        });
    }
});
