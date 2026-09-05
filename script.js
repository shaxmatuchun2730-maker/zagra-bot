document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
    }

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;
    
    // Har bir akkaunt uchun unikal ID kalit
    let user_id = localStorage.getItem("zagra_user_id");
    if (!user_id || user_id.includes("guest")) {
        user_id = "zagra_" + Math.floor(Math.random() * 10000000);
        localStorage.setItem("zagra_user_id", user_id);
    }

    let user_name = localStorage.getItem("zagra_user_nickname") || "";

    const SUPABASE_URL = "https://jgonmawxpwsypvjqtqlt.supabase.co"; 
    const SUPABASE_KEY = "sb_publishable_10jQxY495GgfBJ-_n2UlJw_ujlhx1Tv";

    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
    };

        const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');
    const loginScreen = document.getElementById('login-screen'), nicknameInput = document.getElementById('nickname-input'), startGameBtn = document.getElementById('start-game-btn');
    const currentNameDisplay = document.getElementById('current-name-display'), editProfileTrigger = document.getElementById('edit-profile-trigger');

    if (!user_name || user_name === "Cyber_Pilot") {
        if (loginScreen) loginScreen.style.display = "flex";
    } else {
        if (loginScreen) loginScreen.style.display = "none";
        if (currentNameDisplay) currentNameDisplay.innerText = user_name;
        loadUserData();
    }

    if (startGameBtn) {
        startGameBtn.addEventListener('click', () => {
            let inputVal = nicknameInput.value.trim();
            if (inputVal.length < 2) {
                alert("Nickname must be at least 2 characters!");
                return;
            }
            user_name = inputVal;
            localStorage.setItem("zagra_user_nickname", user_name);
            if (currentNameDisplay) currentNameDisplay.innerText = user_name;
            if (loginScreen) loginScreen.style.display = "none";
            
            showAdBanner();
            saveUserData();
        });
    }

    if (editProfileTrigger) {
        editProfileTrigger.addEventListener('click', () => {
            if (nicknameInput) nicknameInput.value = user_name;
            if (loginScreen) loginScreen.style.display = "flex";
        });
    }

    function showAdBanner() {
        if (AdController) {
            AdController.show()
                .then((result) => { console.log("Ad success"); })
                .catch((result) => { console.log("Ad skipped"); });
        }
    }

    function loadUserData() {
        fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${user_id}`, { method: 'GET', headers })
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    score = data.score || 0;
                    perfects = data.perfects || 0;
                    if (scoreVal) scoreVal.innerText = score;
                    if (perfectVal) perfectVal.innerText = perfects;
                }
            }).catch(err => console.log("Load error"));
    }

    function saveUserData() {
        if (!user_name) return;
        fetch(`${SUPABASE_URL}/rest/v1/rpc/save_zagra_player`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ p_id: user_id, p_name: user_name, p_score: score, p_perfects: perfects })
        })
        .then(() => loadUserData())
        .catch(err => console.log("Save error"));
    }

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
                    showAdBanner();
                } else if (finalTime >= 0.990 && finalTime <= 1.010) {
                    addedScore = 1;
                    feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; feedbackEl.style.color = "#0072ff";
                } else {
                    feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; feedbackEl.style.color = "#ff007f";
                }
                score += addedScore; 
                if (scoreVal) scoreVal.innerText = score;

                saveUserData();
            }
        });
    }

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
            showAdBanner();
        });
    }

    if (subPerfects && subScores) {
        subPerfects.addEventListener('click', () => { subPerfects.classList.add('active'); subScores.classList.remove('active'); loadLiveLeaderboard('perfects'); });
        subScores.addEventListener('click', () => { subScores.classList.add('active'); subPerfects.classList.remove('active'); loadLiveLeaderboard('scores'); });
    }

    function loadLiveLeaderboard(type) {
        const listEl = document.getElementById('leaderboard');
        if (!listEl) return;
        listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#556375;">Syncing live data...</li>';

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
            listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#ff007f;">Connection Error.</li>';
        });
    }
});
