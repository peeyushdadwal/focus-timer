/* ==========================================================================
   FOCUS — xp.js
   Exponential leveling formula, XP awarding, and the daily streak tracker.
   ========================================================================== */

(function (Focus) {
    'use strict';

    // Req = 20 * (level - 1) ^ 1.8 — gets harder each level.
    Focus.getXPRequiredForLevel = function (lvl) {
        if (lvl === 1) return 0;
        return Math.floor(20 * Math.pow(lvl - 1, 1.8));
    };

    Focus.getLevelData = function (totalXP) {
        let level = 1;
        while (totalXP >= Focus.getXPRequiredForLevel(level + 1)) level++;
        const currentLvlStart = Focus.getXPRequiredForLevel(level);
        const nextLvlStart = Focus.getXPRequiredForLevel(level + 1);
        return {
            level: level,
            currentInLevel: totalXP - currentLvlStart,
            reqForNext: nextLvlStart - currentLvlStart
        };
    };

    Focus.addXP = function (amount) {
        Focus.state.totalXP += amount;
        Focus.updateXPUI();
    };

    Focus.updateXPUI = function () {
        const els = Focus.els;
        const data = Focus.getLevelData(Focus.state.totalXP);
        els.levelText.innerText = 'LVL ' + data.level;
        els.totalXp.innerText = Focus.state.totalXP;
        const percent = (data.currentInLevel / data.reqForNext) * 100;
        els.xpBar.style.width = percent + '%';
        els.xpDetail.innerText = Math.floor(data.currentInLevel) + ' / ' + Math.floor(data.reqForNext) + ' XP';
    };

    Focus.awardPeriodicXP = function (minuteCount) {
        const els = Focus.els;
        const base = 10;
        const multiplier = 1 + (minuteCount * 0.1);
        const amount = Math.floor(base * multiplier);

        const prevLevel = Focus.getLevelData(Focus.state.totalXP).level;
        Focus.addXP(amount);
        const newLevel = Focus.getLevelData(Focus.state.totalXP).level;

        Focus.state.sessionXPGained += amount;
        els.sessionXp.innerText = '+' + Focus.state.sessionXPGained + ' XP';
        Focus.sound.xp();

        const float = document.createElement('div');
        float.className = 'floating-points';
        float.style.fontSize = '1.3rem';
        float.innerText = '+' + amount;
        document.querySelector('.center-content').appendChild(float);
        setTimeout(() => float.remove(), 1400);

        if (newLevel > prevLevel) {
            Focus.changeFace('win');
            Focus.showToast("Level up! You're now LVL " + newLevel, 'military_tech');
            if (window.gsap) {
                gsap.fromTo('.level-badge', { scale: 1 }, { scale: 1.25, duration: 0.2, yoyo: true, repeat: 1 });
            }
        }
    };

    // --- Streak tracking ---
    function dateKey(d) { return d.toISOString().slice(0, 10); }
    Focus.dateKey = dateKey;

    Focus.checkStreakValidity = function () {
        const state = Focus.state;
        if (!state.lastSessionDateISO) { state.streak = 0; Focus.updateStreakUI(); return; }
        const last = new Date(state.lastSessionDateISO);
        const today = new Date();
        const diffDays = Math.round((new Date(dateKey(today)) - new Date(dateKey(last))) / 86400000);
        if (diffDays > 1) { state.streak = 0; Focus.saveData(); }
        Focus.updateStreakUI();
    };

    Focus.registerSessionForStreak = function () {
        const state = Focus.state;
        const today = dateKey(new Date());
        if (state.lastSessionDateISO === today) { Focus.updateStreakUI(); return; }
        const yesterday = dateKey(new Date(Date.now() - 86400000));
        state.streak = (state.lastSessionDateISO === yesterday) ? state.streak + 1 : 1;
        state.lastSessionDateISO = today;
        Focus.updateStreakUI();
    };

    Focus.updateStreakUI = function () {
        const els = Focus.els;
        if (Focus.state.streak > 0) {
            els.streakPill.style.display = 'flex';
            els.streakCount.innerText = Focus.state.streak;
        } else {
            els.streakPill.style.display = 'none';
        }
    };

})(window.Focus);
