/* ==========================================================================
   FOCUS — ui.js
   Theme application, settings panel sync, toasts, sound, and modal helpers.
   ========================================================================== */

(function (Focus) {
    'use strict';

    // --- Sound (tiny WebAudio beeps, no external assets) ---
    function ensureAudio() {
        if (!Focus.runtime.audioCtx) {
            try {
                Focus.runtime.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                Focus.runtime.audioCtx = null;
            }
        }
        return Focus.runtime.audioCtx;
    }

    function playTone(freq, duration, type, vol) {
        if (!Focus.state.soundOn) return;
        const ctx = ensureAudio();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    }

    Focus.sound = {
        start: () => playTone(520, 0.15, 'sine', 0.09),
        pause: () => playTone(320, 0.15, 'sine', 0.08),
        xp: () => playTone(880, 0.12, 'triangle', 0.06),
        goal: () => { playTone(660, 0.1, 'sine', 0.08); setTimeout(() => playTone(990, 0.2, 'sine', 0.08), 110); },
        tap: () => playTone(700, 0.1, 'sine', 0.07)
    };

    Focus.toggleSound = function () {
        Focus.state.soundOn = !Focus.state.soundOn;
        Focus.saveData();
        Focus.updateSoundUI();
        if (Focus.state.soundOn) Focus.sound.tap();
    };

    Focus.updateSoundUI = function () {
        const icon = document.getElementById('soundIcon');
        if (icon) icon.innerText = Focus.state.soundOn ? 'volume_up' : 'volume_off';
        const toggle = document.getElementById('soundToggle');
        if (toggle) Focus.state.soundOn ? toggle.classList.add('active') : toggle.classList.remove('active');
    };

    // --- Toast ---
    Focus.showToast = function (msg, icon) {
        const els = Focus.els;
        clearTimeout(Focus.runtime.toastTimer);
        els.toast.innerHTML =
            '<span class="material-icons-round">' + (icon || 'check_circle') + '</span><span>' + msg + '</span>';
        els.toast.classList.add('show');
        Focus.runtime.toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2400);
    };

    // --- Modals ---
    Focus.toggleModal = function (id, show) {
        const m = document.getElementById(id);
        if (show) {
            m.classList.add('open');
            if (id === 'settingsModal') Focus.updateSettingsUI();
        } else {
            m.classList.remove('open');
        }
    };

    Focus.closeAllModals = function () {
        Focus.toggleModal('settingsModal', false);
        Focus.toggleModal('summaryModal', false);
        Focus.toggleModal('detailModal', false);
    };

    // --- Theme ---
    Focus.applyTheme = function () {
        const body = document.body;
        Focus.state.darkMode ? body.setAttribute('data-theme', 'dark') : body.removeAttribute('data-theme');
        if (Focus.state.themeColor) body.setAttribute('data-color', Focus.state.themeColor);
        if (Focus.state.themeBg) body.setAttribute('data-bg', Focus.state.themeBg);
        if (Focus.state.themeFont) body.setAttribute('data-font', Focus.state.themeFont);
        if (Focus.state.themeTexture) body.setAttribute('data-texture', Focus.state.themeTexture);
    };

    Focus.setTheme = function (id) { Focus.state.themeColor = id; Focus.applyTheme(); Focus.saveData(); Focus.updateSettingsUI(); };
    Focus.setBg = function (id) { Focus.state.themeBg = id; Focus.applyTheme(); Focus.saveData(); Focus.updateSettingsUI(); };
    Focus.setFont = function (id) { Focus.state.themeFont = id; Focus.applyTheme(); Focus.saveData(); Focus.updateSettingsUI(); };
    Focus.setTexture = function (id) { Focus.state.themeTexture = id; Focus.applyTheme(); Focus.saveData(); Focus.updateSettingsUI(); };
    Focus.toggleThemeMode = function () { Focus.state.darkMode = !Focus.state.darkMode; Focus.applyTheme(); Focus.saveData(); };

    Focus.toggleMs = function () {
        Focus.state.showMs = !Focus.state.showMs;
        Focus.saveData();
        Focus.updateSettingsUI();
        Focus.updateTimerDisplay(Focus.state.elapsed);
    };

    Focus.adjustGoal = function (delta) {
        Focus.state.dailyGoalMinutes = Math.max(5, Focus.state.dailyGoalMinutes + delta);
        const input = document.getElementById('goalInput');
        if (input) input.value = Focus.state.dailyGoalMinutes;
        Focus.saveData();
    };

    Focus.setGoalFromInput = function (val) {
        const n = parseInt(val, 10);
        if (!isNaN(n) && n > 0) { Focus.state.dailyGoalMinutes = n; Focus.saveData(); }
    };

    Focus.updateSettingsUI = function () {
        document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.theme-circle').forEach(c => c.classList.remove('selected'));

        const circles = document.querySelectorAll('.theme-circle');
        Focus.themeColors.forEach((c, i) => {
            if (c.id === Focus.state.themeColor && circles[i]) circles[i].classList.add('selected');
        });

        const bgBtn = document.getElementById('bg-' + Focus.state.themeBg);
        if (bgBtn) bgBtn.classList.add('active');
        const fontBtn = document.getElementById('font-' + Focus.state.themeFont);
        if (fontBtn) fontBtn.classList.add('active');
        const texBtn = document.getElementById('tex-' + (Focus.state.themeTexture || 'clean'));
        if (texBtn) texBtn.classList.add('active');

        const msToggle = document.getElementById('msToggle');
        if (msToggle) Focus.state.showMs ? msToggle.classList.add('active') : msToggle.classList.remove('active');
        Focus.updateSoundUI();

        const goalInput = document.getElementById('goalInput');
        if (goalInput) goalInput.value = Focus.state.dailyGoalMinutes;
    };

    // --- Clock ---
    Focus.updateClock = function () {
        const now = new Date();
        Focus.els.clock.innerText = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    // --- Kaomoji face ---
    Focus.changeFace = function (type) {
        const arr = Focus.faces[type] || Focus.faces.idle;
        Focus.els.face.innerText = arr[Math.floor(Math.random() * arr.length)];
    };

    // --- Confetti burst ---
    Focus.fireConfetti = function () {
        const els = Focus.els;
        const ctx = els.canvas.getContext('2d');
        els.canvas.width = window.innerWidth;
        els.canvas.height = window.innerHeight;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const count = reduceMotion ? 0 : 90;
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: window.innerWidth / 2, y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15 - 5,
                color: 'hsl(' + (Math.random() * 360) + ', 90%, 55%)',
                size: Math.random() * 7 + 3, life: 100
            });
        }

        function animate() {
            ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
            let active = false;
            particles.forEach(p => {
                if (p.life > 0) {
                    active = true;
                    p.x += p.vx; p.y += p.vy; p.vy += 0.5; p.life--;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            if (active) requestAnimationFrame(animate);
            else ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
        }
        animate();
    };

    Focus.escapeHtml = function (str) {
        const d = document.createElement('div');
        d.innerText = str;
        return d.innerHTML;
    };

})(window.Focus);
