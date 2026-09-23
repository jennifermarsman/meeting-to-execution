export const PROMPTS = [
  { title: 'Make room for a small win', text: 'Choose one manageable thing you would like to make time for today. A small step counts.', tag: 'YOUR PACE' },
  { title: 'Notice what went well', text: 'Think of one thing you appreciated about your day. You do not need to write it down here.', tag: 'REFLECT' },
  { title: 'Leave yourself a kind note', text: 'What would you say to a friend starting again? Try offering yourself the same kindness.', tag: 'BE KIND' },
  { title: 'Make tomorrow a little easier', text: 'Pick one small bit of preparation that future you might appreciate.', tag: 'MAKE SPACE' },
  { title: 'Choose your own next step', text: 'You know your day best. Choose an activity that feels right for you, or leave this for another day.', tag: 'YOUR CHOICE' },
  { title: 'Pause and check in', text: 'Take a moment to notice how your day is going. There is no right answer and nothing to submit.', tag: 'CHECK IN' },
  { title: 'Keep what works for you', text: 'Think of something in your routine you would like to keep. Progress can mean staying where you are.', tag: 'KEEP GOING' }
];

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date && date >= '1900-01-01';
}

export function assertDate(date, today = localDate()) {
  if (!validDate(date) || date > today) throw new Error('Choose a valid date from 1900 through today.');
}

export function toKg(value, unit) {
  if (!['kg', 'lb'].includes(unit)) throw new Error('Choose kg or lb.');
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') {
    throw new Error('Enter a weight.');
  }
  const kg = Number(value) * (unit === 'lb' ? 0.45359237 : 1);
  if (!Number.isFinite(kg) || kg < 1 || kg > 700) {
    throw new Error('Enter a weight between 1 and 700 kg (2.3 and 1543.2 lb). This is an input limit, not a health recommendation.');
  }
  return kg;
}

export function fromKg(kg, unit) {
  if (!['kg', 'lb'].includes(unit)) throw new Error('Choose kg or lb.');
  return unit === 'lb' ? kg / 0.45359237 : kg;
}

export function blankState(profile = {}) {
  return {
    version: 1,
    profile: { mode: 'habits', unit: 'kg', hideNumbers: false, persist: false, targetKg: null, ...profile },
    weights: [],
    days: {}
  };
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateState(state) {
  if (!object(state) || state.version !== 1) throw new Error('Unsupported saved data version. Export recovery data or explicitly erase it to start again.');
  const p = state.profile;
  if (!object(p) || !['habits', 'goal', 'maintenance'].includes(p.mode) ||
      !['kg', 'lb'].includes(p.unit) || typeof p.hideNumbers !== 'boolean' ||
      typeof p.persist !== 'boolean' || (p.targetKg !== null && (typeof p.targetKg !== 'number' ||
      !Number.isFinite(p.targetKg) || p.targetKg < 1 || p.targetKg > 700))) {
    throw new Error('Saved preferences are invalid. Existing data has not been replaced.');
  }
  if (!Array.isArray(state.weights) || !object(state.days)) throw new Error('Saved history is invalid.');
  const dates = new Set();
  for (const entry of state.weights) {
    if (!object(entry) || !validDate(entry.date) || dates.has(entry.date) ||
        typeof entry.kg !== 'number' || !Number.isFinite(entry.kg) || entry.kg < 1 || entry.kg > 700) {
      throw new Error('Saved weight records are invalid.');
    }
    dates.add(entry.date);
  }
  for (const [date, day] of Object.entries(state.days)) {
    if (!validDate(date) || !object(day) || !Number.isInteger(day.prompt) ||
        day.prompt < 0 || day.prompt >= PROMPTS.length || typeof day.completed !== 'boolean') {
      throw new Error('Saved journey records are invalid.');
    }
  }
  return state;
}

export function saveWeight(state, date, value, { replace = false, today = localDate() } = {}) {
  validateState(state);
  assertDate(date, today);
  const kg = toKg(value, state.profile.unit);
  const exists = state.weights.some(entry => entry.date === date);
  if (exists && !replace) throw new Error('There is already an entry for this date. Choose Edit in your history to replace it.');
  if (!exists && replace) throw new Error('This entry no longer exists. Add a new entry instead.');
  const next = structuredClone(state);
  next.weights = [...next.weights.filter(entry => entry.date !== date), { date, kg }]
    .sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

export function dayState(state, date = localDate()) {
  if (!validDate(date)) throw new Error('Invalid journey date.');
  return state.days[date] ?? {
    prompt: Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000) % PROMPTS.length,
    completed: false
  };
}

export function updateDay(state, action, date = localDate()) {
  validateState(state);
  assertDate(date);
  const next = structuredClone(state);
  const day = { ...dayState(state, date) };
  if (action === 'complete') day.completed = true;
  else if (action === 'undo') day.completed = false;
  else if (action === 'swap') {
    if (day.completed) throw new Error('Undo today\'s completion before choosing a different step.');
    day.prompt = (day.prompt + 1) % PROMPTS.length;
  } else throw new Error('Unknown journey action.');
  next.days[date] = day;
  return next;
}

export function completedDays(state) {
  return Object.values(state.days).filter(day => day.completed).length;
}

export function reachedTarget(state) {
  const sorted = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  const { mode, targetKg } = state.profile;
  return mode === 'goal' && targetKg !== null && sorted.length > 0 &&
    sorted[0].kg >= targetKg && sorted.at(-1).kg <= targetKg;
}

export function demoState(today = localDate()) {
  const state = blankState({ mode: 'maintenance' });
  for (let i = 6; i >= 0; i--) {
    const date = new Date(`${today}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - i);
    const key = date.toISOString().slice(0, 10);
    state.weights.push({ date: key, kg: [78.4, 78.2, 78.5, 78.1, 78.3, 78.2, 78.3][6 - i] });
    if (i > 0 && i !== 3) state.days[key] = { prompt: i % PROMPTS.length, completed: true };
  }
  return state;
}
