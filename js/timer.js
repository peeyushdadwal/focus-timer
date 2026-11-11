/* ==========================================================================
   FOCUS — timer.js
   Timer start/pause/reset, the SVG progress ring, and daily-goal tracking.
   ========================================================================== */

(function (Focus) {
    'use strict';

    Focus.toggleTimer = function () {
        Focus.state.isRunning ? Focus.pauseTimer() : Focus.startTimer();
    };

    Focus.startTimer = function () {
        const state = Focus.state;
        const els = Focus.els;

        state.isRunning = true;
        const now = new Date().getTime();
        state.startTime = now - state.elapsed;
        state.sessionStartTimestamp = now;
        state.sessionXPGained = 0;
        state.lastMinuteCheck = Math.floor(state.elapsed / 60000);
        state.sessionStartXP = state.totalXP;
        state.sessionStartLevel = Focus.getLevelData(state.totalXP).level;
        state._goalHit = false;

        Focus.runtime.tInterval = setInterval(Focus.runTimer, 10);

        Focus.changeFace('active');
        els.btnToggle.classList.add('active');
        els.btnToggle.setAttribute('aria-label', 'Pause timer');
        els.btnToggle.innerHTML = '<span class="material-icons-round" style="font-size:2.3rem;">pause</span>';
        els.btnReset.classList.remove('visible');
        els.sessionXp.style.opacity = 1;
        Focus.sound.start();
        Focus.saveData();
    };

    Focus.runTimer = function () {
        const state = Focus.state;
        const els = Focus.els;
        const now = new Date().getTime();
        state.elapsed = now - state.startTime;
        Focus.updateTimerDisplay(state.elapsed);

        const currentMin = Math.floor(state.elapsed / 60000);
        if (currentMin > state.lastMinuteCheck) {
            Focus.awardPeriodicXP(currentMin);
            state.lastMinuteCheck = currentMin;
        }

        if (state.dailyGoalMinutes > 0) {
            const goalMs = state.dailyGoalMinutes * 60000;
            const pct = Math.min(100, Math.floor((state.elapsed / goalMs) * 100));
            els.goalProgress.innerText = state.elapsed >= goalMs
                ? 'Daily goal reached!'
                : pct + '% of ' + state.dailyGoalMinutes + 'm goal';
            els.goalProgress.classList.add('visible');

            if (state.elapsed >= goalMs && !state._goalHit) {
                state._goalHit = true;
                Focus.sound.goal();
                Focus.showToast('Daily goal reached — ' + state.dailyGoalMinutes + ' min', 'emoji_events');
            }
        }
    };

    Focus.pauseTimer = function () {
        const state = Focus.state;
        const els = Focus.els;

        clearInterval(Focus.runtime.tInterval);
        state.isRunning = false;

        const now = new Date();
        const start = new Date(state.sessionStartTimestamp);
        const endLevel = Focus.getLevelData(state.totalXP).level;

        Focus.runtime.tempSessionData = {
            startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }),
            startISO: start.toISOString(),
            endISO: now.toISOString(),
            durationMs: state.elapsed,
            rawXP: state.sessionXPGained,
            levelStart: state.sessionStartLevel,
            levelEnd: endLevel,
            levelsGained: endLevel - state.sessionStartLevel
        };

        Focus.fireConfetti();
        Focus.populateSummaryModal();
        Focus.toggleModal('summaryModal', true);

        Focus.changeFace('idle');
        els.btnToggle.classList.remove('active');
        els.btnToggle.setAttribute('aria-label', 'Start timer');
        els.btnToggle.innerHTML = '<span class="material-icons-round" style="font-size:2.3rem;">play_arrow</span>';
        els.btnReset.classList.add('visible');
        Focus.sound.pause();
        Focus.saveData();
    };

    Focus.resetTimer = function () {
        const state = Focus.state;
        const els = Focus.els;

        clearInterval(Focus.runtime.tInterval);
        state.isRunning = false;
        state.elapsed = 0;
        state.startTime = null;
        state.sessionXPGained = 0;
        state._goalHit = false;

        Focus.updateTimerDisplay(0);
        els.ring.style.strokeDashoffset = Focus.CIRCUMFERENCE;
        els.btnReset.classList.remove('visible');
        els.sessionXp.style.opacity = 0;
        els.sessionXp.innerText = '+0 XP';
        els.goalProgress.classList.remove('visible');
        Focus.changeFace('idle');
        Focus.saveData();
    };

    Focus.updateTimerDisplay = function (msTime) {
        const els = Focus.els;
        const state = Focus.state;

        const hours = Math.floor((msTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((msTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msTime % (1000 * 60)) / 1000);
        const milliseconds = Math.floor((msTime % 1000) / 10);

        const hStr = hours > 0 ? (hours < 10 ? '0' + hours + ':' : hours + ':') : '';
        const mStr = (minutes < 10) ? '0' + minutes : minutes;
        const sStr = (seconds < 10) ? '0' + seconds : seconds;
        const msStr = (milliseconds < 10) ? '0' + milliseconds : milliseconds;

        els.time.innerHTML = state.showMs ? (hStr + mStr + ':' + sStr + '.' + msStr) : (hStr + mStr + ':' + sStr);

        const currentSec = seconds + (milliseconds / 100);
        const percent = currentSec / 60;
        const offset = Focus.CIRCUMFERENCE - (percent * Focus.CIRCUMFERENCE);
        els.ring.style.strokeDashoffset = offset;

        if (seconds % 15 === 0 && milliseconds === 0 && state.isRunning) Focus.changeFace('active');
        if (minutes >= 45 && state.isRunning && seconds % 20 === 0 && milliseconds === 0) Focus.changeFace('tired');
    };

})(window.Focus);
