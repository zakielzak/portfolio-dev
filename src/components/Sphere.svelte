<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
  import DisplacementSphere from './DisplacementSphere.svelte';

  export let media: { mobile: number; tablet: number };

 
  const getThemePreference = (): 'light' | 'dark' => {
      if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
        return localStorage.getItem("theme") as 'light' | 'dark';
      }
   
      if (typeof window !== "undefined" && window.matchMedia) {

        return window.matchMedia("(prefers-color-scheme: light)").matches
          ? "dark"
          : "light"; 
      }
      return 'dark'; 
  };
  
  let currentTheme: 'light' | 'dark' = 'dark';
  let themeObserver: MutationObserver | null = null;
  
  onMount(() => {
    currentTheme = getThemePreference();

    if (typeof document !== 'undefined') {
        themeObserver = new MutationObserver(() => {
            const isDarkNow = document.documentElement.classList.contains("dark");
            const newTheme = isDarkNow ? "dark" : "light";
            
            currentTheme = newTheme; 
        });

        themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });
    }

    // Cleanup
    return () => {
      if (themeObserver) {
          themeObserver.disconnect();
      }
    };
  });
</script>

<DisplacementSphere
  theme={currentTheme}
  {media}
/>