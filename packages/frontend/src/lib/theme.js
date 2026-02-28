export function getTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tt_theme');
    if (saved) return saved;
    // Optional: detect OS pref if desired, user asked defaults to 'light'
    return 'light';
  }
  return 'light';
}

export function setTheme(theme) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tt_theme', theme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}
