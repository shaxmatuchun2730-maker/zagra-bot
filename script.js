document.addEventListener("DOMContentLoaded", () => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
    }

    let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;
    
    // AKKAUNTNING DOIMIYLIK KAFOLATI
    let user_id = localStorage.getItem("zagra_final_user_id");
    if (!user_id) {
        user_id = tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "zagra_player_" + Math.floor(performance.now() + Math.random() * 10000000);
        localStorage.setItem("zagra_final_user_id", user_id);
    }

    // ISMNI KAFOLATLI OLISH: Motor qulflanishining oldi olindi
    let user_name = localStorage.getItem("zagra_user_nickname") || tg?.initDataUnsafe?.user?.first_name || "Cyber_Pilot_" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem("zagra_user_nickname", user_name);

    // SIZ TAQDIM ETGAN TO'G'RI SUPABASE HAVOLASI
    const SUPABASE_URL = "https://jgonmawxpwsypvjqtqlt.supabase.co"; 
    const SUPABASE_KEY = "sb_publishable_10jQxY495GgfBJ-_n2UlJw_ujlhx1Tv";

    const headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
    };

    // DOM ELEMENTLARINI BOG'LASH
    const timerEl = document.getElementById('timer');
    const feedbackEl = document.getElementById('feedback');
    const actionBtn = document.getElementById('action-btn');
    
    const headerScoreVal = document.getElementById('game-score-val');
    const headerPerfectVal = document.getElementById('game-perfect-val');
    
    const currentNameDisplay = document.getElementById('current-name-display');
    const profileModal = document.getElementById('profile-modal');
    const nicknameInput = document.getElementById('nickname-input');
    const editProfileTrigger = document.getElementById('edit-profile-trigger');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const saveNicknameBtn = document.getElementById('save-nickname-btn');

    const tabGame = document.getElementById('tab-game');
    const tabRank = document.getElementById('tab-rank');
    const gameView = document.getElementById('game-view');
    const rankView = document.getElementById('rank-view');

    const subPerfects = document.getElementById('sub-perfects');
    const subScores = document.getElementById('sub-scores');

    // BOSHIDANOQ ISMNI EKRANGA CHIQARISH VA DATANI YUKLASH
    if (currentNameDisplay) currentNameDisplay.innerText = user_name;
    loadUserData();

    // PASTKI ASOSIY NAVIGATSIYA (GAME / RANKING)
    if (tabGame) {
        tabGame.addEventListener('click', () => {
            tabGame.classList.add('active'); 
            if (tabRank) tabRank.classList.remove('active');
            if (gameView) gameView.style.display = 'flex'; 
            if (rankView) rankView.style.display = 'none';
        });
    }

    if (tabRank) {
        tabRank.addEventListener('click', () => {
            tabRank.classList.add('active'); 
            if (tabGame) tabGame.classList.remove('active');
            if (gameView) gameView.style.display = 'none'; 
            if (rankView) rankView.style.display = 'flex';
            loadLiveLeaderboard('perfects');
        });
    }

    // REYTING ICHKI FILTRLARI (PERFECT KINGS / TOP SCORES)
    if (subPerfects && subScores) {
        subPerfects.addEventListener('click', () => { 
            subPerfects.classList.add('active'); 
            subScores.classList.remove('active'); 
            loadLiveLeaderboard('perfects'); 
        });
        subScores.addEventListener('click', () => { 
            subScores.classList.add('active'); 
            subPerfects.classList.remove('active'); 
            loadLiveLeaderboard('scores'); 
        });
    }

    // PROFILE TAHRIRLASH MODAL TUGMALARI (✏️)
    if (editProfileTrigger) {
        editProfileTrigger.addEventListener('click', () => {
            if (nicknameInput) nicknameInput.value = user_name;
            if (profileModal) profileModal.style.display = 'flex';
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            if (profileModal) profileModal.style.display = 'none';
        });
    }

    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', () => {
            let inputVal = nicknameInput ? nicknameInput.value.trim() : "";
            if (inputVal.length < 2) {
                alert("Nickname must be at least 2 characters!");
                return;
            }
            user_name = inputVal;
            localStorage.setItem("zagra_user_nickname", user_name);
            if (currentNameDisplay) currentNameDisplay.innerText = user_name;
            if (profileModal) profileModal.style.display = 'none';
            saveUserData();
        });
    }

    // BAZADAN MA'LUMOTLARNI VA ENG YANGI ISMNI YUKLASH FUNKSIYASI (MASSIV TO'G'RI TOZALANDI)
    function loadUserData() {
        if (!user_id) return;
        fetch(`${SUPABASE_URL}/rest/v1/players?id=eq.${user_id}`, { method: 'GET', headers })
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    const pilotData = data[0]; // [0] orqali massivning birinchi elementini aniq o'qiymiz!
                    
                    user_name = pilotData.name || tg?.initDataUnsafe?.user?.first_name || user_name;
                    localStorage.setItem("zagra_user_nickname", user_name);
                    if (currentNameDisplay) currentNameDisplay.innerText = user_name;

                    score = pilotData.score || 0; 
                    perfects = pilotData.perfects || 0;
                    
                    if (headerScoreVal) headerScoreVal.innerText = score;
                    if (headerPerfectVal) headerPerfectVal.innerText = perfects;
                }
            }).catch(err => console.log("Load error"));
    }

    // BAZAGA MA'LUMOT SAQLASH FUNKSIYASI
    function saveUserData() {
        if (!user_name || user_name.trim() === "") return;
        fetch(`${SUPABASE_URL}/rest/v1/rpc/save_zagra_player`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ p_id: user_id, p_name: user_name, p_score: score, p_perfects: perfects })
        })
        .then(() => loadUserData())
        .catch(err => console.log("Save error"));
    }

    // TIMER HARAKATI MATEMATIKASI
    function updateTimer() {
        let elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= 1.5) startTime = performance.now();
        if (timerEl) timerEl.innerText = elapsed.toFixed(3);
    }

    // START / STOP TUGMASI MEXANIZMI VA ADOLATLI "+2 PT" BAL TIZIMI
    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            if (!isRunning) {
                isRunning = true; 
                actionBtn.innerText = "STOP";
                actionBtn.style.background = "linear-gradient(90deg, #00f0ff, #0072ff)";
                if (feedbackEl) {
                    feedbackEl.innerText = "FOCUS NOW..."; 
                    feedbackEl.style.color = "var(--text-sub)";
                }
                startTime = performance.now();
                timerInterval = setInterval(updateTimer, 1);
            } else {
                isRunning = false; 
                clearInterval(timerInterval);
                actionBtn.innerText = "START";
                actionBtn.style.background = "linear-gradient(90deg, #ff007f, #7f00ff)";
                
                let finalTime = timerEl ? parseFloat(timerEl.innerText) : 0;
                let addedScore = 0;

                if (finalTime === 1.000) {
                    perfects += 1; 
                    addedScore = 10;
                    if (feedbackEl) {
                        feedbackEl.innerText = "🎯 PERFECT HIT! +10"; 
                        feedbackEl.style.color = "#00f0ff";
                    }
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                } else if (finalTime >= 0.995 && finalTime <= 1.005) {
                    addedScore = 2; // SIZ AYTGANDEK ENDI HIGH ACCURACY UCHUN +2 PT!
                    if (feedbackEl) {
                        feedbackEl.innerText = "🔥 EXCELLENT! +2 PT"; 
                        feedbackEl.style.color = "#00f0ff";
                    }
                } else if (finalTime >= 0.990 && finalTime <= 1.010) {
                    addedScore = 1;
                    if (feedbackEl) {
                        feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; 
                        feedbackEl.style.color = "#0072ff";
                    }
                } else {
                    if (feedbackEl) {
                        feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; 
                        feedbackEl.style.color = "#ff007f";
                    }
                }
                
                score += addedScore; 
                
                if (headerScoreVal) headerScoreVal.innerText = score;
                if (headerPerfectVal) headerPerfectVal.innerText = perfects;
                
                saveUserData();
            }
        });
    }

    // JONLI REYTING JADVALINI TORTISH
    function loadLiveLeaderboard(type) {
        const listEl = document.getElementById('leaderboard');
        if (!listEl) return;
        listEl.innerHTML = '<li style="text-align:center; padding:20px; color:#556375;">Syncing leaderboard...</li>';

        let orderQuery = type === 'perfects' ? 'perfects.desc' : 'score.desc';
        
        fetch(`${SUPABASE_URL}/rest/v1/players?order=${orderQuery}&limit=100`, { method: 'GET', headers })
        .then(res => res.json())
        .then(data => {
            listEl.innerHTML = '';
