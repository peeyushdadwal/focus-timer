/* ==========================================================================
   FOCUS — app.js
   Entry point. Boots state, builds dynamic UI pieces (color grid), restores
   saved state, and wires up global keyboard shortcuts + modal dismissal.
   ========================================================================== */

(function (Focus) {
    'use strict';

    function buildColorGrid() {
        const grid = document.getElementById('colorGrid');
        Focus.themeColors.forEach(c => {
            const circle = document.createElement('div');
            circle.className = 'theme-circle' + (Focus.state.themeColor === c.id ? ' selected' : '');
            circle.style.backgroundColor = c.hex;
            circle.setAttribute('role', 'button');
            circle.setAttribute('tabindex', '0');
            circle.setAttribute('aria-label', 'Accent colour ' + c.id);
            circle.onclick = () => Focus.setTheme(c.id);
            circle.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); Focus.setTheme(c.id); } };
            grid.appendChild(circle);
        });
    }

    function restoreTimerVisuals() {
        const state = Focus.state;
        const els = Focus.els;
        if (state.isRunning) { state.isRunning = false; Focus.saveData(); }

        if (state.elapsed > 0) {
            els.btnReset.classList.add('visible');
            Focus.updateTimerDisplay(state.elapsed);
        } else {
            Focus.updateTimerDisplay(0);
            els.ring.style.strokeDashoffset = Focus.CIRCUMFERENCE;
        }
    }

    function bindGlobalEvents() {
        document.addEventListener('keydown', (e) => {
            const tag = (e.target && e.target.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); Focus.toggleTimer(); }
            if (e.code === 'Escape') Focus.closeAllModals();
            if (e.code === 'KeyH') Focus.toggleHistory();
        });

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) Focus.closeAllModals();
            });
        });
    }

    function init() {
        Focus.cacheElements();
        Focus.loadData();
        Focus.updateClock();
        setInterval(Focus.updateClock, 1000);

        buildColorGrid();
        Focus.applyTheme();
        Focus.updateXPUI();
        Focus.renderHistory();
        Focus.updateStreakUI();
        Focus.checkStreakValidity();

        const goalInput = document.getElementById('goalInput');
        if (goalInput) goalInput.value = Focus.state.dailyGoalMinutes;

        restoreTimerVisuals();
        bindGlobalEvents();

        if (window.gsap) {
            gsap.to(Focus.els.face, { scale: 1.08, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
    }

    document.addEventListener('DOMContentLoaded', init);

})(window.Focus);
