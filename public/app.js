import {
  PROMPTS, blankState, localDate, fromKg, toKg, validateState, saveWeight,
  dayState, updateDay, completedDays, reachedTarget, demoState
} from './model.js';
import { STORAGE_KEY, loadState, persistState } from './storage.js';

const $ = id => document.getElementById(id);
let state = null;
let demo = false;
let blocked = false;
let editingDate = null;
let renderedDate = localDate();
let draftTarget = null;
let draftUnit = 'kg';

function error(message) {
  $('message').textContent = '';
  $('error').textContent = message;
  $('error').hidden = false;
}

function notify(message) {
  $('message').textContent = message;
}

function commit(next) {
  if (blocked) throw new Error('Data changed or could not be read. Reload or use the recovery controls before editing.');
  validateState(next);
  if (!demo) {
    try {
      persistState(window.localStorage, next);
    } catch (cause) {
      throw new Error(`Changes were not saved. Browser storage may be blocked or full. ${cause.message}`);
    }
  }
  state = next;
  $('error').hidden = true;
  return true;
}

function act(fn) {
  try { fn(); } catch (cause) { error(cause.message); }
}

function weightText(kg) {
  return `${fromKg(kg, state.profile.unit).toFixed(1)} ${state.profile.unit}`;
}

function dateText(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderJourney() {
  const total = completedDays(state);
  const chapter = Math.floor(total / 7) + 1;
  const point = total % 7;
  const spots = [[54, 169], [116, 155], [175, 181], [239, 162], [303, 121], [367, 142], [426, 96]];
  $('chapter-badge').textContent = `Chapter ${chapter}`;
  $('journey-count').textContent = `${total} chosen ${total === 1 ? 'step' : 'steps'} taken`;
  $('journey-scene').innerHTML = `<svg viewBox="0 0 480 238" role="img" aria-label="Meadow journey, ${total} chosen steps completed. Chapter ${chapter}.">
    <rect width="480" height="238" fill="#e8eedf"/><circle cx="363" cy="45" r="23" fill="#e9cc8e"/>
    <path d="M0 100 Q100 48 220 106 T480 76 V238 H0Z" fill="#cdd9bf"/>
    <path d="M0 141 Q130 82 257 146 T480 124 V238 H0Z" fill="#b6c9a4"/>
    <path d="M0 207 Q120 168 280 208 T480 174 V238 H0Z" fill="#96b08d"/>
    <path d="M22 183 C90 128 108 137 164 178 S261 153 301 121 S374 167 450 76" stroke="#f8f3dc" stroke-width="20" fill="none" stroke-linecap="round"/>
    <g fill="#5b805e"><path d="M36 105l16-36 16 36h-12v20h-8v-20Z"/><path d="M403 68l12-28 12 28h-9v14h-6V68Z"/><path d="M310 202l16-35 16 35h-12v19h-8v-19Z"/></g>
    <g fill="#f5e4a3"><circle cx="92" cy="204" r="3"/><circle cx="105" cy="212" r="3"/><circle cx="254" cy="92" r="3"/><circle cx="261" cy="100" r="3"/></g>
    ${spots.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === point ? 15 : 7}" fill="${i <= point ? '#315743' : '#f8f3dc'}" stroke="${i === point ? '#fffdf4' : '#829575'}" stroke-width="${i === point ? 4 : 2}"/>`).join('')}
    <g transform="translate(${spots[point][0]},${spots[point][1]})" fill="#f5e7bc"><path d="M-4 4v-9h4q6 0 6 5v4H2V0q0-2-2-2v6Z"/></g>
    <text x="25" y="29" fill="#4b6650" font-size="9" font-family="system-ui" letter-spacing="2">A NEW DAY. YOUR OWN WAY.</text>
  </svg>`;
}

function chart(weights) {
  if (weights.length < 2) return '<p class="fine">Your trend will appear after a second dated check-in. There is no hurry.</p>';
  const values = weights.map(entry => fromKg(entry.kg, state.profile.unit));
  const low = Math.min(...values) - 0.5;
  const high = Math.max(...values) + 0.5;
  const first = Date.parse(weights[0].date);
  const span = Date.parse(weights.at(-1).date) - first;
  const points = weights.map((entry, i) => [
    58 + ((Date.parse(entry.date) - first) / span) * 412,
    18 + ((high - values[i]) / (high - low)) * 110
  ]);
  return `<svg class="chart" viewBox="0 0 500 162" role="img" aria-label="Weight history in ${state.profile.unit}. Exact values are available in the history table below.">
    ${[0, 1, 2].map(i => `<line x1="58" x2="470" y1="${18 + i * 55}" y2="${18 + i * 55}" stroke="#e2e6dc" stroke-dasharray="4 4"/><text x="0" y="${22 + i * 55}">${(high - (high - low) * i / 2).toFixed(1)}</text>`).join('')}
    <polyline points="${points.map(p => p.join(',')).join(' ')}" fill="none" stroke="#527762" stroke-width="2.5" stroke-linejoin="round"/>
    ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#527762" stroke="#fffef9" stroke-width="2"/>`).join('')}
    <text x="58" y="153">${weights[0].date}</text><text x="470" y="153" text-anchor="end">${weights.at(-1).date}</text>
  </svg>`;
}

function renderProgress() {
  const hidden = state.profile.hideNumbers;
  $('visibility-button').textContent = hidden ? 'Show numbers' : 'Hide numbers';
  if (hidden) {
    editingDate = null;
    $('progress-content').innerHTML = '<div class="empty"><span class="hidden-symbol" aria-hidden="true">~</span><h3>Your journey is more than a number.</h3><p>Weight values, targets and the chart are hidden.</p><p class="fine">Show numbers to log or edit a weight. This changes the display, not stored data or exports.</p></div>';
    return;
  }
  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = weights.at(-1);
  const delta = latest ? fromKg(latest.kg - weights[0].kg, state.profile.unit) : 0;
  $('progress-content').innerHTML = `
    ${latest ? `<div class="weight-summary"><div><span>Latest check-in &middot; ${dateText(latest.date)}</span><strong>${weightText(latest.kg)}</strong></div><div><span>Change since first entry</span><strong>${delta > 0 ? '+' : ''}${delta.toFixed(1)} <small>${state.profile.unit}</small></strong></div></div>${chart(weights)}`
      : '<div class="empty"><h3>A fresh page for your journey.</h3><p>Add your first check-in whenever you are ready. Weight logging is optional.</p></div>'}
    <form id="weight-form" class="weight-form"><div><label for="weight-date">Check-in date</label><input id="weight-date" type="date" min="1900-01-01" max="${localDate()}" required></div><div><label for="weight-value">Weight (${state.profile.unit})</label><input id="weight-value" type="number" step="any" inputmode="decimal" required placeholder="${state.profile.unit}"></div><button class="primary" type="submit">${editingDate ? 'Save edit' : 'Add check-in'}</button>${editingDate ? '<button id="cancel-edit" class="quiet" type="button">Cancel edit</button>' : ''}</form>
    ${weights.length ? `<details id="history-details"><summary>View and edit history (${weights.length})</summary><div class="history"><table><caption class="fine">All recorded weights, newest first</caption><thead><tr><th scope="col">Date</th><th scope="col">Weight</th><th scope="col">Actions</th></tr></thead><tbody>${[...weights].reverse().map(entry => `<tr><td>${dateText(entry.date)}</td><td>${weightText(entry.kg)}</td><td><button type="button" class="quiet" data-edit="${entry.date}" aria-label="Edit ${entry.date}">Edit</button> <button type="button" class="quiet danger" data-delete="${entry.date}" aria-label="Delete ${entry.date}">Delete</button></td></tr>`).join('')}</tbody></table></div></details>` : ''}
    <p class="fine">A record, not a score. Changes in either direction do not affect your journey.</p>`;
  $('weight-date').value = editingDate ?? localDate();
  $('weight-date').disabled = Boolean(editingDate);
  if (editingDate) $('weight-value').value = fromKg(weights.find(entry => entry.date === editingDate).kg, state.profile.unit).toString();
  $('weight-form').addEventListener('submit', event => {
    event.preventDefault();
    act(() => {
      const next = saveWeight(state, $('weight-date').value, $('weight-value').value, { replace: Boolean(editingDate) });
      commit(next);
      editingDate = null;
      render();
      notify(state.profile.persist ? 'Check-in saved in this browser.' : 'Check-in added for this session only.');
      $('weight-value').focus();
    });
  });
  $('cancel-edit')?.addEventListener('click', () => { editingDate = null; renderProgress(); $('weight-value').focus(); });
}

function renderFocus() {
  const modes = {
    habits: ['Make space for your routine', 'A small chosen action is enough. Weight logging is optional, and there is no target to chase.'],
    goal: ['Your goal, on your terms', 'Choose your own optional target in preferences. This app does not recommend a target or a rate of weight change.'],
    maintenance: ['Staying here is progress, too', 'Keep the routines that fit your life. You do not need to keep losing weight to keep moving along your path.']
  };
  const [title, description] = modes[state.profile.mode];
  $('focus-title').textContent = title;
  $('focus-description').textContent = description;
  $('target-message').replaceChildren();
  if (!state.profile.hideNumbers && state.profile.mode === 'goal' && state.profile.targetKg !== null) {
    const p = document.createElement('p');
    p.textContent = `Your chosen target: ${weightText(state.profile.targetKg)}. This is not a recommended weight.`;
    $('target-message').append(p);
  }
  if (reachedTarget(state)) {
    const div = document.createElement('div');
    div.className = 'target-notice';
    const p = document.createElement('p');
    p.textContent = state.profile.hideNumbers
      ? 'Maintenance is always an option. You choose what comes next.'
      : 'Your latest entry is at or below your chosen target. Would you like to focus on maintenance? Your target will not be lowered.';
    const button = document.createElement('button');
    button.className = 'quiet';
    button.textContent = 'Choose maintenance';
    button.addEventListener('click', () => act(() => {
      const next = structuredClone(state);
      next.profile.mode = 'maintenance';
      commit(next); render(); notify('Maintenance selected. Your journey continues.');
    }));
    div.append(p, button);
    $('target-message').append(div);
  }
}

function render() {
  const focusedId = document.activeElement?.id;
  $('welcome').hidden = Boolean(state) || blocked;
  $('dashboard').hidden = !state || blocked;
  $('settings-button').hidden = !state || blocked;
  $('recovery').hidden = !blocked;
  if (!state || blocked) {
    for (const id of ['progress-content', 'target-message', 'target-control', 'journey-scene']) $(id).replaceChildren();
    $('settings-form').reset();
    draftTarget = null;
    return;
  }
  if (state.profile.hideNumbers) $('target-control').replaceChildren();
  renderedDate = localDate();
  $('today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  $('storage-badge').textContent = demo ? 'Synthetic sample / session only' : state.profile.persist ? 'Saved in this browser' : 'Session only / not saved';
  $('demo-notice').hidden = !demo;
  const day = dayState(state);
  const prompt = PROMPTS[day.prompt];
  $('prompt-title').textContent = day.completed ? 'You made space for yourself.' : prompt.title;
  $('prompt-text').textContent = day.completed ? 'Your chosen step is complete for today. Come back when it feels right. Your path will be here.' : prompt.text;
  $('prompt-tag').textContent = day.completed ? 'TODAY, ON YOUR TERMS' : prompt.tag;
  $('complete-button').textContent = day.completed ? 'Undo today\'s step' : 'I took this step';
  $('swap-button').hidden = day.completed;
  renderJourney();
  renderProgress();
  renderFocus();
  if (focusedId) $(focusedId)?.focus({ preventScroll: true });
}

function renderTargetControl() {
  const form = $('settings-form');
  $('target-control').replaceChildren();
  if (form.elements.hideNumbers.checked || form.elements.mode.value !== 'goal') return;
  const label = document.createElement('label');
  label.htmlFor = 'settings-target';
  label.textContent = `My optional target (${draftUnit})`;
  const input = document.createElement('input');
  input.id = 'settings-target';
  input.type = 'number';
  input.step = 'any';
  input.inputMode = 'decimal';
  input.value = draftTarget === null ? '' : fromKg(draftTarget, draftUnit).toString();
  const help = document.createElement('p');
  help.id = 'target-help';
  help.className = 'fine';
  help.textContent = 'Your choice, not a recommendation. Leave blank for no target. The app will never lower it automatically.';
  input.setAttribute('aria-describedby', 'target-help');
  $('target-control').append(label, input, help);
}

function captureTarget() {
  const input = $('settings-target');
  if (input) draftTarget = input.value.trim() === '' ? null : toKg(input.value, draftUnit);
}

function openSettings() {
  const form = $('settings-form');
  for (const key of ['mode', 'unit']) form.elements[key].value = state.profile[key];
  for (const key of ['hideNumbers', 'persist']) form.elements[key].checked = state.profile[key];
  form.elements.persist.disabled = demo;
  draftTarget = state.profile.targetKg;
  draftUnit = state.profile.unit;
  $('settings-error').textContent = '';
  renderTargetControl();
  $('settings-dialog').showModal();
}

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function erase() {
  if (!window.confirm('Erase all of this app\'s saved data and current session? This cannot be undone. Downloaded exports and browser backups will not be removed.')) return;
  if (!demo) window.localStorage.removeItem(STORAGE_KEY);
  state = null; blocked = false; demo = false; editingDate = null;
  $('settings-dialog').close();
  $('error').hidden = true;
  $('onboard-form').reset();
  render();
  notify('App data erased. Exports and backups, if any, must be deleted separately.');
  $('onboard-mode').focus();
}

$('onboard-form').addEventListener('submit', event => {
  event.preventDefault();
  act(() => {
    const form = event.currentTarget;
    commit(blankState({
      mode: form.elements.mode.value, unit: form.elements.unit.value,
      hideNumbers: form.elements.hideNumbers.checked, persist: form.elements.persist.checked
    }));
    render(); $('main').focus(); notify('Your journey is ready. You choose what comes next.');
  });
});
$('demo-button').addEventListener('click', () => {
  demo = true; state = demoState(); render(); $('main').focus(); notify('Exploring synthetic sample data. Nothing is saved.');
});
$('exit-demo').addEventListener('click', () => {
  demo = false; state = null; editingDate = null; $('message').textContent = ''; render(); $('onboard-mode').focus();
});
$('complete-button').addEventListener('click', () => act(() => {
  const wasCompleted = dayState(state).completed;
  commit(updateDay(state, wasCompleted ? 'undo' : 'complete')); render();
  notify(wasCompleted ? 'Today\'s step was undone.' : 'One chosen step taken. No need to do more today.');
}));
$('swap-button').addEventListener('click', () => act(() => {
  commit(updateDay(state, 'swap')); render(); notify('A different step, if it suits you.');
}));
$('visibility-button').addEventListener('click', () => act(() => {
  const next = structuredClone(state);
  next.profile.hideNumbers = !next.profile.hideNumbers;
  editingDate = null;
  commit(next); render(); notify(next.profile.hideNumbers ? 'Weight numbers hidden from view.' : 'Weight numbers are visible.');
}));
$('progress-content').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.edit) {
    editingDate = button.dataset.edit;
    renderProgress(); $('weight-value').focus();
  }
  if (button.dataset.delete) act(() => {
    if (!window.confirm(`Delete the check-in for ${button.dataset.delete}?`)) return;
    const next = structuredClone(state);
    next.weights = next.weights.filter(entry => entry.date !== button.dataset.delete);
    commit(next); editingDate = null; render(); notify('Check-in deleted. Your chosen steps are unchanged.');
    $('weight-value').focus();
  });
});
for (const id of ['settings-button', 'focus-settings']) $(id).addEventListener('click', openSettings);
$('cancel-settings').addEventListener('click', () => $('settings-dialog').close());
for (const name of ['unit', 'mode', 'hideNumbers']) {
  $('settings-form').elements[name].addEventListener('change', () => {
    try {
      captureTarget();
      draftUnit = $('settings-form').elements.unit.value;
      $('settings-error').textContent = '';
      renderTargetControl();
    } catch (cause) {
      $('settings-form').elements.unit.value = draftUnit;
      $('settings-error').textContent = cause.message;
    }
  });
}
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    captureTarget();
    const form = event.currentTarget;
    const next = structuredClone(state);
    next.profile = { mode: form.elements.mode.value, unit: form.elements.unit.value,
      hideNumbers: form.elements.hideNumbers.checked, persist: !demo && form.elements.persist.checked, targetKg: draftTarget };
    commit(next); editingDate = null; $('settings-dialog').close(); render();
    notify('Preferences updated. You can change your focus any time.');
  } catch (cause) { $('settings-error').textContent = cause.message; }
});
$('export-button').addEventListener('click', () => act(() => {
  if (!window.confirm('Download a plaintext JSON file containing all weight values, targets and preferences, even if numbers are hidden? Store it privately.')) return;
  download(JSON.stringify(state, null, 2), `next-step-${demo ? 'synthetic-' : ''}${localDate()}.json`);
  notify('Export downloaded. This file is not encrypted.');
}));
$('erase-button').addEventListener('click', () => act(erase));
$('recover-erase').addEventListener('click', () => act(erase));
$('recover-download').addEventListener('click', () => act(() => {
  if (!window.confirm('Download raw saved data? It may contain sensitive weight data and is not encrypted.')) return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) throw new Error('No saved record is available. Reload to start a new session.');
  download(raw, 'next-step-recovery.json');
}));
window.addEventListener('storage', event => {
  if (!demo && (event.key === STORAGE_KEY || event.key === null)) {
    blocked = true; $('settings-dialog').close(); render();
    error('This app\'s saved data changed in another tab. Reload before editing to avoid replacing those changes.');
  }
});
function refreshDay() {
  if (state && !blocked && renderedDate !== localDate()) { editingDate = null; render(); notify('A new local day. Your next step is ready.'); }
}
window.addEventListener('focus', refreshDay);
document.addEventListener('visibilitychange', refreshDay);
setInterval(refreshDay, 30000);

try { state = loadState(window.localStorage); }
catch (cause) { blocked = true; error(`Unable to open saved data: ${cause.message}`); }
render();
