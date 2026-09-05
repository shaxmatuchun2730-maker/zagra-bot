const tg = window.Telegram.WebApp;
tg.expand();

let score = 0, perfects = 0, isRunning = false, startTime = 0, timerInterval = null;
let user_name = tg.initDataUnsafe?.user?.first_name || "Player";

const timerEl = document.getElementById('timer'), feedbackEl = document.getElementById('feedback');
const actionBtn = document.getElementById('action-btn'), scoreVal = document.getElementById('score-val'), perfectVal = document.getElementById('perfect-val');

function updateTimer() {
    let elapsed = (performance.now() - startTime) / 1000;
    if (elapsed >= 1.5) startTime = performance.now();
    timerEl.innerText = elapsed.toFixed(3);
}

actionBtn.addEventListener('click', () => {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium'); // Jismoniy tebranish

    if (!isRunning) {
        isRunning = true; actionBtn.innerText = "STOP";
        actionBtn.style.background = "linear-gradient(90deg, #00f0ff, #0072ff)";
        actionBtn.style.boxShadow = "0 0 30px rgba(0, 240, 255, 0.5)";
        feedbackEl.innerText = "FOCUS NOW..."; startTime = performance.now();
        timerInterval = setInterval(updateTimer, 1);
    } else {
        isRunning = false; clearInterval(timerInterval);
        actionBtn.innerText = "START";
        actionBtn.style.background = "linear-gradient(90deg, #ff007f, #7f00ff)";
        actionBtn.style.boxShadow = "0 0 30px rgba(255, 0, 127, 0.45)";
        
        let finalTime = parseFloat(timerEl.innerText);
        let addedScore = 0;

        if (finalTime === 1.000) {
            perfects++; addedScore = 10;
            perfectVal.innerText = perfects;
            feedbackEl.innerText = "🎯 PERFECT HIT! +10"; feedbackEl.style.color = "var(--neon-cyan)";
            if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else if (finalTime >= 0.990 && finalTime <= 1.010) {
            addedScore = 1;
            feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; feedbackEl.style.color = "#0072ff";
        } else {
            feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; feedbackEl.style.color = "var(--neon-pink)";
        }
        score += addedScore; scoreVal.innerText = score;

        // Ballarni Telegram bulut tizimiga yuborish
        if (addedScore > 0) {
            tg.sendData(JSON.stringify({ score: score, perfects: perfects }));
        }
    }
});

// Navigatsiya Paneli Boshqaruvi
document.getElementById('tab-game').addEventListener('click', () => toggleTab('game'));
document.getElementById('tab-rank').addEventListener('click', () => { toggleTab('rank'); loadMockLeaderboard('perfects'); });
document.getElementById('sub-perfects').addEventListener('click', () => { document.getElementById('sub-perfects').classList.add('active'); document.getElementById('sub-scores').classList.remove('active'); loadMockLeaderboard('perfects'); });
document.getElementById('sub-scores').addEventListener('click', () => { document.getElementById('sub-scores').classList.add('active'); document.getElementById('sub-perfects').classList.remove('active'); loadMockLeaderboard('scores'); });

function toggleTab(type) {
    document.getElementById('tab-game').classList.toggle('active', type==='game');
    document.getElementById('tab-rank').classList.toggle('active', type==='rank');
    document.getElementById('game-view').style.display = type==='game' ? 'flex' : 'none';
    document.getElementById('rank-view').style.display = type==='rank' ? 'flex' : 'none';
}

function loadMockLeaderboard(type) {
    const listEl = document.getElementById('leaderboard');
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
