/* ==========================================================================
   FOCUS — state.js
   App-wide state object, constants, DOM cache, and persistence.
   Exposes everything on the shared `Focus` namespace.
   ========================================================================== */

window.Focus = window.Focus || {};

(function (Focus) {
    'use strict';

    Focus.STORAGE_KEY = 'focusMoji_v5';
    Focus.CIRCUMFERENCE = 2 * Math.PI * 200;

    Focus.state = {
        totalXP: 0,
        history: [],
        themeColor: 'blue',
        themeBg: 'mesh',
        themeFont: 'poppins',
        themeTexture: 'clean',
        darkMode: false,
        showMs: true,
        soundOn: true,
        dailyGoalMinutes: 25,
        streak: 0,
        lastSessionDateISO: null,
        startTime: null,
        elapsed: 0,
        isRunning: false,
        sessionStartTimestamp: null,
        sessionXPGained: 0,
        lastMinuteCheck: 0
    };

    // Runtime-only (not persisted meaningfully, rebuilt each load)
    Focus.runtime = {
        tInterval: null,
        tempSessionData: {},
        audioCtx: null,
        toastTimer: null
    };

    Focus.themeColors = [
        { id: 'blue', hex: '#007AFF' },
        { id: 'purple', hex: '#AF52DE' },
        { id: 'orange', hex: '#FF9500' },
        { id: 'green', hex: '#34C759' },
        { id: 'pink', hex: '#FF2D55' },
        { id: 'red', hex: '#FF3B30' }
    ];

    Focus.faces = {
        idle: ["(・_・)", "(-_-)", "(o_o)", "(^-^)", "(¬_¬)", "( ´_ゝ`)"],
        active: ["(ò_ó)", "(>_<)", "(•̀ᴗ•́)و", "(¬‿¬)", "(ง •̀_•́)ง", "(ᵔᴥᵔ)", "(☞ﾟヮﾟ)☞"],
        lap: ["(^_~)", "(◕‿◕)", "(★^O^★)", "(๑˃ᴗ˂)ﻭ"],
        win: ["(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧", "＼(＾O＾)／", "ヽ(´▽`)/", "(ﾉ´ヮ`)ﾉ*: ･ﾟ"],
        tired: ["(－_－) zzZ", "(. ❛ ᴗ ❛.)", "(¬_¬ )ﾉ"]
    };

    // DOM cache — populated on DOMContentLoaded by app.js via Focus.cacheElements()
    Focus.els = {};

    Focus.cacheElements = function () {
        Focus.els = {
            ring: document.getElementById('ringProgress'),
            time: document.getElementById('timeDisplay'),
            face: document.getElementById('kaomoji'),
            lapList: document.getElementById('lapList'),
            btnToggle: document.getElementById('btnToggle'),
            btnReset: document.getElementById('btnReset'),
            xpBar: document.getElementById('xpBar'),
            levelText: document.getElementById('levelText'),
            xpDetail: document.getElementById('xpDetail'),
            totalXp: document.getElementById('totalXpDisplay'),
            clock: document.getElementById('clockText'),
            sessionXp: document.getElementById('sessionXpDisplay'),
            canvas: document.getElementById('confettiCanvas'),
            goalProgress: document.getElementById('goalProgressText'),
            streakPill: document.getElementById('streakPill'),
            streakCount: document.getElementById('streakCount'),
            historyBtn: document.getElementById('historyBtn'),
            toast: document.getElementById('toast')
        };
    };

    Focus.saveData = function () {
        try {
            localStorage.setItem(Focus.STORAGE_KEY, JSON.stringify(Focus.state));
        } catch (e) {
            /* storage unavailable (private mode, quota, etc.) — fail silently */
        }
    };

    Focus.loadData = function () {
        try {
            const data = localStorage.getItem(Focus.STORAGE_KEY);
            if (data) Focus.state = Object.assign({}, Focus.state, JSON.parse(data));
        } catch (e) {
            /* ignore corrupt data and keep defaults */
        }
    };

    Focus.clearAllData = function () {
        if (confirm('Reset everything? This clears your XP, streak, and history.')) {
            localStorage.removeItem(Focus.STORAGE_KEY);
            location.reload();
        }
    };

})(window.Focus);
