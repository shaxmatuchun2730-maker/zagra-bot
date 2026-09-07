    // START / STOP TUGMASI MOTORINI QAYTA JONLANTIRISH
    if (actionBtn) {
        actionBtn.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            if (!isRunning) {
                isRunning = true; 
                actionBtn.innerText = "STOP";
                actionBtn.style.background = "linear-gradient(90deg, #00f0ff, #0072ff)";
                feedbackEl.innerText = "FOCUS NOW..."; 
                startTime = performance.now();
                timerInterval = setInterval(updateTimer, 1);
            } else {
                isRunning = false; 
                clearInterval(timerInterval);
                actionBtn.innerText = "START";
                actionBtn.style.background = "linear-gradient(90deg, #ff007f, #7f00ff)";
                
                let finalTime = parseFloat(timerEl.innerText);
                let addedScore = 0;

                if (finalTime === 1.000) {
                    perfects += 1; 
                    addedScore = 10;
                    feedbackEl.innerText = "🎯 PERFECT HIT! +10"; 
                    feedbackEl.style.color = "#00f0ff";
                    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
                } else if (finalTime >= 0.995 && finalTime <= 1.005) {
                    addedScore = 1;
                    feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; 
                    feedbackEl.style.color = "#0072ff";
                } else if (finalTime >= 0.990 && finalTime <= 1.010) {
                    addedScore = 1;
                    feedbackEl.innerText = "🔥 SO CLOSE! +1 PT"; 
                    feedbackEl.style.color = "#0072ff";
                } else {
                    feedbackEl.innerText = "❌ MISSED IT! TRY AGAIN"; 
                    feedbackEl.style.color = "#ff007f";
                }
                
                score += addedScore; 
                
                // Soniya tepasidagi yangi panelda ballarni darhol yangilaymiz!
                if (headerScoreVal) headerScoreVal.innerText = score;
                if (headerPerfectVal) headerPerfectVal.innerText = perfects;
                
                saveUserData();
            }
        });
    }
