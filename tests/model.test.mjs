import test from 'node:test';
import assert from 'node:assert/strict';
import { PROMPTS, blankState, localDate, validDate, toKg, fromKg, validateState, saveWeight, dayState, updateDay, completedDays, reachedTarget, demoState } from '../public/model.js';
import { loadState, persistState, STORAGE_KEY } from '../public/storage.js';

test('units round-trip without mutating canonical weights', () => {
  for (const kg of [1, 50.123456, 700]) assert.ok(Math.abs(toKg(fromKg(kg, 'lb'), 'lb') - kg) < 0.000001);
  assert.equal(toKg('100', 'kg'), 100);
  assert.equal(toKg(100, 'lb'), 45.359237);
  for (const bad of [NaN, Infinity, -1, 0, '', ' ', 'oops', 701, null, true]) assert.throws(() => toKg(bad, 'kg'));
  assert.throws(() => toKg(60, 'oz'));
});

test('local calendar date does not use UTC date', () => {
  const oldTZ = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(localDate(new Date('2026-09-23T01:00:00Z')), '2026-09-22');
    assert.equal(localDate(new Date('2026-03-08T09:59:00Z')), '2026-03-08');
    assert.equal(localDate(new Date('2026-03-08T10:01:00Z')), '2026-03-08');
  } finally {
    if (oldTZ === undefined) delete process.env.TZ; else process.env.TZ = oldTZ;
  }
});

test('calendar validation, duplicate dates, edit and non-future records', () => {
  assert.equal(validDate('2024-02-29'), true);
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', 'x', '1899-12-31', '__proto__']) assert.equal(validDate(date), false);
  const state = blankState();
  const first = saveWeight(state, '2026-01-01', 80, { today: '2026-01-02' });
  assert.equal(state.weights.length, 0);
  assert.throws(() => saveWeight(first, '2026-01-01', 81, { today: '2026-01-02' }), /already an entry/);
  const next = saveWeight(first, '2026-01-01', 81, { replace: true, today: '2026-01-02' });
  assert.deepEqual(next.weights, [{ date: '2026-01-01', kg: 81 }]);
  assert.throws(() => saveWeight(next, '2026-01-03', 80, { today: '2026-01-02' }), /valid date/);
  assert.throws(() => saveWeight(next, '2026-01-02', 80, { replace: true }), /no longer exists/);
});

test('completion is idempotent; undo and swaps preserve other days', () => {
  let state = blankState();
  const date = '2026-01-01';
  const original = dayState(state, date);
  state = updateDay(state, 'swap', date);
  assert.equal(dayState(state, date).prompt, (original.prompt + 1) % PROMPTS.length);
  state = updateDay(updateDay(state, 'complete', date), 'complete', date);
  assert.equal(completedDays(state), 1);
  assert.throws(() => updateDay(state, 'swap', date), /Undo/);
  state = updateDay(state, 'complete', '2026-01-02');
  state = updateDay(state, 'undo', date);
  assert.equal(completedDays(state), 1);
  assert.equal(state.days['2026-01-02'].completed, true);
  assert.throws(() => updateDay(state, 'unknown', date), /Unknown/);
});

test('journey continues after seven days and is independent of weight', () => {
  let state = blankState();
  for (let i = 1; i <= 10; i++) state = updateDay(state, 'complete', `2026-01-${String(i).padStart(2, '0')}`);
  assert.equal(completedDays(state), 10);
  state = saveWeight(state, '2026-01-11', 90);
  assert.equal(completedDays(state), 10);
});

test('user goal is never lowered, maintenance has no weight loss requirement', () => {
  let state = blankState({ mode: 'goal', targetKg: 75 });
  state = saveWeight(state, '2026-01-01', 80);
  assert.equal(reachedTarget(state), false);
  state = saveWeight(state, '2026-01-02', 75);
  assert.equal(reachedTarget(state), true);
  assert.equal(state.profile.targetKg, 75);
  state.profile.mode = 'maintenance';
  assert.equal(reachedTarget(state), false);
  state.profile.mode = 'habits';
  assert.equal(reachedTarget(state), false);
});

test('saved schema rejects malformed data without logging sensitive contents', () => {
  const mutations = [
    s => { s.version = 2; },
    s => { s.profile.mode = 'unknown'; },
    s => { s.profile.persist = 'true'; },
    s => { s.profile.targetKg = -4; },
    s => { s.weights = [{ date: '2026-01-01', kg: 0 }]; },
    s => { s.weights = [{ date: '2026-01-01', kg: 70 }, { date: '2026-01-01', kg: 71 }]; },
    s => { s.days = { '2026-01-01': { prompt: 99, completed: true } }; },
    s => { s.days = []; }
  ];
  for (const mutation of mutations) {
    const state = blankState(); mutation(state);
    assert.throws(() => validateState(state));
  }
  assert.throws(() => validateState(null));
  assert.equal(validateState(demoState()).profile.persist, false);
});

function memoryStorage() {
  const map = new Map();
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) };
}

test('persistence is opt-in and erase is scoped to the app key', () => {
  const storage = memoryStorage();
  storage.setItem('unrelated-app', 'keep');
  assert.equal(loadState(storage), null);
  persistState(storage, blankState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
  persistState(storage, blankState({ persist: true }));
  assert.equal(loadState(storage).profile.persist, true);
  persistState(storage, blankState());
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem('unrelated-app'), 'keep');
});

test('invalid JSON and unconsented data are not overwritten on load', () => {
  const storage = memoryStorage();
  for (const raw of ['{broken', JSON.stringify(blankState())]) {
    storage.setItem(STORAGE_KEY, raw);
    assert.throws(() => loadState(storage));
    assert.equal(storage.getItem(STORAGE_KEY), raw);
  }
});

test('storage errors propagate; previous saved state is preserved', () => {
  const storage = memoryStorage();
  const state = blankState({ persist: true });
  persistState(storage, state);
  storage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => persistState(storage, { ...state, weights: [{ date: '2026-01-01', kg: 80 }] }), /Quota/);
  assert.deepEqual(loadState(storage), state);
});
