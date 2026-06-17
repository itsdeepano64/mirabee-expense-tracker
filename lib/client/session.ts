const ENTRY_KEY = 'mirabee-entry';
const ENTRY_VALUE = 'jenni';

/** Session-only sign-in — clears when the browser tab/app session ends. */
export function hasEntrySession(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(ENTRY_KEY) === ENTRY_VALUE;
}

export function setEntrySession(): void {
  sessionStorage.setItem(ENTRY_KEY, ENTRY_VALUE);
}

export function clearEntrySession(): void {
  sessionStorage.removeItem(ENTRY_KEY);
}