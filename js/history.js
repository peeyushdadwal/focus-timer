/* ==========================================================================
   FOCUS — history.js
   Session-complete summary modal, saved-session CRUD, list rendering,
   and JSON export.
   ========================================================================== */

(function (Focus) {
    'use strict';

    // --- Summary modal (shown right after pausing) ---
    Focus.populateSummaryModal = function () {
        const data = Focus.runtime.tempSessionData;
        const ms = data.durationMs;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);

        document.getElementById('sumDuration').innerText = m + 'm ' + s + 's';
        document.getElementById('sumXP').innerText = '+' + data.rawXP;
        document.getElementById('sumTimes').innerText = data.startTime + ' - ' + data.endTime;
        document.getElementById('sessionNameInput').value = '';

        const lvlGain = data.levelsGained;
        document.getElementById('sumLevels').innerText = lvlGain > 0
            ? '+' + lvlGain + ' Level' + (lvlGain > 1 ? 's' : '') + ' (LVL ' + data.levelStart + ' → ' + data.levelEnd + ')'
            : 'No level up';

        const title = document.getElementById('summaryTitle');
        title.innerText = m < 1 ? 'Quick session' : (lvlGain > 0 ? 'Level up!' : 'Session complete!');

        setTimeout(() => document.getElementById('sessionNameInput').focus(), 300);
    };

    Focus.saveSession = function () {
        const data = Focus.runtime.tempSessionData;
        const name = document.getElementById('sessionNameInput').value.trim() || 'Focus Session';

        const ms = data.durationMs;
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const durStr = m > 0 ? m + 'm ' + s + 's' : s + 's';

        const item = {
            id: Date.now(),
            name: name,
            duration: durStr,
            date: data.date,
            startISO: data.startISO,
            endISO: data.endISO,
            timeRange: data.startTime + ' - ' + data.endTime,
            xp: data.rawXP,
            levelStart: data.levelStart,
            levelEnd: data.levelEnd,
            levelsGained: data.levelsGained
        };

        Focus.state.history.unshift(item);
        Focus.registerSessionForStreak();
        Focus.saveData();
        Focus.renderHistory();
        Focus.toggleModal('summaryModal', false);
        Focus.showToast('Session saved', 'check_circle');
        Focus.resetTimer();
    };

    Focus.dismissSession = function () {
        Focus.toggleModal('summaryModal', false);
    };

    // --- History list rendering ---
    Focus.renderHistory = function () {
        const els = Focus.els;
        els.lapList.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'lap-header';
        header.innerHTML =
            '<h3>Session history</h3>' +
            '<div class="lap-header-actions">' +
            '<button type="button" onclick="Focus.exportHistory()" aria-label="Export history" title="Export as JSON"><span class="material-icons-round">download</span></button>' +
            '<button type="button" onclick="Focus.toggleHistory()" aria-label="Close history"><span class="material-icons-round">close</span></button>' +
            '</div>';
        els.lapList.appendChild(header);

        if (Focus.state.history.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'lap-empty';
            empty.innerHTML = '<span class="material-icons-round">inbox</span><span>No sessions yet — start the timer to begin your streak.</span>';
            els.lapList.appendChild(empty);
            els.historyBtn.classList.remove('has-items');
            return;
        }

        els.historyBtn.classList.add('has-items');
        Focus.state.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'lap-item';
            div.setAttribute('role', 'button');
            div.setAttribute('tabindex', '0');
            div.onclick = () => Focus.openEditModal(item.id);
            div.onkeydown = (e) => { if (e.key === 'Enter') Focus.openEditModal(item.id); };
            div.innerHTML =
                '<div class="lap-info">' +
                '<span class="lap-name">' + Focus.escapeHtml(item.name) + '</span>' +
                '<span class="lap-val">' + item.duration + ' <span style="font-size:0.85em; color:var(--success)">+' + item.xp + ' XP</span></span>' +
                '<span class="lap-time-stamp">' + item.timeRange + '</span>' +
                '</div>' +
                '<span class="material-icons-round" style="color:var(--text-sub); font-size:1.1rem">chevron_right</span>';
            els.lapList.appendChild(div);
        });
    };

    Focus.toggleHistory = function () {
        const list = Focus.els.lapList;
        const icon = document.getElementById('historyIcon');
        if (list.classList.contains('expanded')) {
            list.classList.remove('expanded');
            icon.innerText = 'history';
        } else {
            list.classList.add('expanded');
            icon.innerText = 'expand_more';
        }
    };

    // --- Detail / edit modal for a saved session ---
    Focus.openEditModal = function (id) {
        const item = Focus.state.history.find(h => h.id === id);
        if (!item) return;

        document.getElementById('editId').value = id;
        document.getElementById('editNameInput').value = item.name;
        document.getElementById('detDuration').innerText = item.duration;
        document.getElementById('detXP').innerText = item.xp;

        const detLevels = document.getElementById('detLevels');
        detLevels.innerText = item.levelsGained > 0
            ? '+' + item.levelsGained + ' Level' + (item.levelsGained > 1 ? 's' : '') + ' (LVL ' + item.levelStart + ' → ' + item.levelEnd + ')'
            : 'No level up';

        const start = new Date(item.startISO);
        const end = new Date(item.endISO);
        document.getElementById('detDateTime').innerText =
            item.date + ' • ' +
            start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' – ' +
            end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        Focus.toggleModal('detailModal', true);
    };

    Focus.updateHistoryItem = function () {
        const id = parseInt(document.getElementById('editId').value, 10);
        const newName = document.getElementById('editNameInput').value.trim();

        const idx = Focus.state.history.findIndex(h => h.id === id);
        if (idx !== -1) {
            Focus.state.history[idx].name = newName || 'Focus Session';
            Focus.saveData();
            Focus.renderHistory();
            Focus.toggleModal('detailModal', false);
            Focus.showToast('Updated', 'check_circle');
        }
    };

    Focus.deleteHistoryItem = function () {
        if (confirm('Delete this record?')) {
            const id = parseInt(document.getElementById('editId').value, 10);
            Focus.state.history = Focus.state.history.filter(h => h.id !== id);
            Focus.saveData();
            Focus.renderHistory();
            Focus.toggleModal('detailModal', false);
            Focus.showToast('Deleted', 'delete');
        }
    };

    // --- Export ---
    Focus.exportHistory = function () {
        if (Focus.state.history.length === 0) { Focus.showToast('No sessions to export', 'info'); return; }

        const payload = JSON.stringify({
            exportedAt: new Date().toISOString(),
            totalXP: Focus.state.totalXP,
            streak: Focus.state.streak,
            history: Focus.state.history
        }, null, 2);

        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'focus-history-' + Focus.dateKey(new Date()) + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        Focus.showToast('History exported', 'download_done');
    };

})(window.Focus);
