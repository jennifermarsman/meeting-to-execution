import { validateState } from './model.js';

export const STORAGE_KEY = 'next-step:v1';

export function loadState(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Saved data is not valid JSON. Recover or erase it explicitly; it has not been overwritten.');
  }
  validateState(parsed);
  if (!parsed.profile.persist) throw new Error('Saved data lacks storage consent. Recover or erase it explicitly.');
  return parsed;
}

export function persistState(storage, state) {
  validateState(state);
  if (state.profile.persist) storage.setItem(STORAGE_KEY, JSON.stringify(state));
  else storage.removeItem(STORAGE_KEY);
}
