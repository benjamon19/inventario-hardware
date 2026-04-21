export function ThemeScript() {
  const script = `
    (function() {
      try {
        var saved = localStorage.getItem('bodega-theme');
        
        // CAMBIO: Solo activamos dark si el usuario lo eligió explícitamente 
        // o si eligió 'system' y el sistema está en dark. 
        // Si 'saved' es null (primera vez), isDark será false.
        var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}