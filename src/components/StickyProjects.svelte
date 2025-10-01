<script lang="ts">
/*   import { onMount, onDestroy } from 'svelte';
  import Lenis from 'lenis';

  // Reactive variables for Svelte 5
  let isTitleSticky = $state(false);
  let lenisInstance = $state();

  onMount(() => {
    // Initialize Lenis
    lenisInstance = new Lenis({
      autoRaf: true,
      lerp: 0.05,
      smoothWheel: true,
    });

    const projectsSection = document.querySelector('.projects-section');
    const titleElement = document.querySelector('.projects-title');

    const handleScroll = (e: any) => {
      if (!projectsSection || !titleElement) return;

      const sectionRect = projectsSection.getBoundingClientRect();
      
      // Toggle sticky state based on scroll position
      if (sectionRect.top <= 0 && !isTitleSticky) {
        isTitleSticky = true;
      } else if (sectionRect.top > 50 && isTitleSticky) {
        isTitleSticky = false;
      }
    };

    lenisInstance.on('scroll', handleScroll);

    // Cleanup on component destroy
    onDestroy(() => {
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    });
  }); */
</script>

<section class="projects-section mt-[620px]">
  <h2
    class:sticky-title={isTitleSticky}
    class="projects-title before:content-[''] before:rounded-[4px] before:inline-block before:size-4 dark:before:bg-white/80 before:bg-black before:mr-2 shrink-0 text-xl font-offbit transition-all duration-200"
  >
    <!-- The title text should be passed as a prop or slot -->
    Projects Title
  </h2>

  <div class="flex flex-col gap-14 mt-4">
    <!-- Project cards will be passed via a slot -->
    <slot />
  </div>
</section>

<style>
  .sticky-title {
    position: sticky;
    top: 0;
    background: white; /* Adjust for dark mode */
    z-index: 10;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }
</style>