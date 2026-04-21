export function ThemeScript() {
  const script = `
    (function() {
      try {
        var saved = localStorage.getItem('bodega-theme');
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = saved === 'dark' || ((!saved || saved === 'system') && systemDark);
        
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;
  // Usamos dangerouslySetInnerHTML para que el script se ejecute inmediatamente al cargar el HTML
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}