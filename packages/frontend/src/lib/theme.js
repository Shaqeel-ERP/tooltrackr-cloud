export function getTheme() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return 'light';
}

export function setTheme(theme) {
  if (typeof window !== 'undefined') {
    const isDark = theme === 'dark';
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    if (!isDark) root.classList.remove('dark'); // Ensure it's off if light
  }
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}
