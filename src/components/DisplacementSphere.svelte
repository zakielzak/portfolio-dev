<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import {
    AmbientLight, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshPhongMaterial,
    PerspectiveCamera, Scene, SphereGeometry, UniformsUtils, Vector2, WebGLRenderer,
    Object3D
  } from 'three';
  
  // Utilidades importadas
  import { cleanRenderer, cleanScene, removeLights, throttle } from '../lib/three';
  
  // Shaders: Asegúrate que estas rutas y la sintaxis ?raw funcionen en tu Vite/Astro config.
  import fragmentShader from './displacement-sphere-fragment.glsl?raw';
  import vertexShader from './displacement-sphere-vertex.glsl?raw';

  // --- STORES (Sustituto de useSpring para la rotación) ---
  const rotationX = writable(0);
  const rotationY = writable(0);

  // --- PROPS ---
  export let theme: 'light' | 'dark' = 'dark';
  export let media: { mobile: number; tablet: number };

  // --- REFERENCIAS DE THREE.JS ---
  let canvasRef: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  let camera: PerspectiveCamera;
  let scene: Scene;
  let lights: (AmbientLight | DirectionalLight)[] = [];
  let uniforms: { [uniform: string]: any } = {};
  let material: MeshPhongMaterial;
  let geometry: SphereGeometry;
  let sphere: Mesh;

  // --- ESTADO REACTIVO Y DE CONTROL ---
  let reduceMotion = false;
  let isInViewport = false;
  let windowSize = { width: 0, height: 0 };
  let animationFrame: number;
  const start = Date.now();
  let onMouseMove: (event: MouseEvent) => void | undefined;
  
  // La función de inicialización aislada para reuso
  const initThree = () => {
    const { innerWidth, innerHeight } = window;
    
    // 1. Renderer
    renderer = new WebGLRenderer({ 
      canvas: canvasRef, antialias: false, alpha: true,
      powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true,
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = LinearSRGBColorSpace; 

    // 2. Camera
    camera = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 52; 
    scene = new Scene(); 

    // 3. Material y Shaders
    material = new MeshPhongMaterial();
    material.onBeforeCompile = shader => { 
      // Se garantiza que uniforms se llene en el primer render
      uniforms = UniformsUtils.merge([ 
        shader.uniforms, 
        { time: {  value: 0 } }, 
      ]); 
      shader.uniforms = uniforms; 
      shader.vertexShader = vertexShader; 
      shader.fragmentShader = fragmentShader; 
    }; 

    // 4. Geometría y Malla
    geometry = new SphereGeometry(32, 128, 128); 
    sphere = new Mesh(geometry, material); 
    sphere.position.z = 0; 
    (sphere as Object3D & { modifier?: number }).modifier = Math.random(); 
    scene.add(sphere);

    // Forzar el primer render para ejecutar onBeforeCompile y llenar 'uniforms'
    renderer.render(scene, camera);
  }

  // -----------------------------------------------------------------
  // 🛠️ FUNCIÓN DE ANIMACIÓN
  // -----------------------------------------------------------------
  const animateLoop = () => { 
    // Comprobación de existencia para evitar el TypeError
    if (!sphere || !uniforms || !renderer || !camera) return;

    uniforms.time.value = 0.00005 * (Date.now() - start); 

    sphere.rotation.z += 0.001; 
    sphere.rotation.x = $rotationX; 
    sphere.rotation.y = $rotationY; 

    renderer.render(scene, camera); 
    animationFrame = requestAnimationFrame(animateLoop); 
  }; 

  // -----------------------------------------------------------------
  // $ REACCIONES REACTIVAS (Gestión del Ciclo de Vida)
  // -----------------------------------------------------------------

  // 1. Luces / Tema (Simula useEffect [theme])
  $: {
    if (scene && lights.length) {
      removeLights(lights);
      
      const dirLight = new DirectionalLight(0xffffff, theme === 'light' ? 1.8 : 2.0);
      const ambientLight = new AmbientLight(0xffffff, theme === 'light' ? 2.7 : 0.4);

      dirLight.position.z = 200;
      dirLight.position.x = 100;
      dirLight.position.y = 100;

      lights = [dirLight, ambientLight];
      lights.forEach(light => scene.add(light));
    }
  }

  // 2. Resize / Posición de Esfera (Simula useEffect [reduceMotion, windowSize, media])
  $: {
    if (renderer && camera && sphere && windowSize.width && media) {
      const { width, height } = windowSize;
      const adjustedHeight = height + height * 0.3;
      
      renderer.setSize(width, adjustedHeight);
      camera.aspect = width / adjustedHeight;
      camera.updateProjectionMatrix();

      if (width <= media.mobile) {
        sphere.position.x = 14; sphere.position.y = 10;
      } else if (width <= media.tablet) {
        sphere.position.x = 18; sphere.position.y = 14;
      } else {
        sphere.position.x = 22; sphere.position.y = 16;
      }
      
      if (reduceMotion) {
        renderer.render(scene, camera);
      }
    }
  }

  // 3. Mouse Move (Simula useEffect [isInViewport, reduceMotion])
  $: {
    if (typeof window !== 'undefined') {
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      
      if (!reduceMotion && isInViewport) {
        onMouseMove = throttle(event => {
          const position = {
            x: event.clientX / window.innerWidth,
            y: event.clientY / window.innerHeight,
          };
          rotationX.set(position.y / 2);
          rotationY.set(position.x / 2);
        }, 100); 

        window.addEventListener('mousemove', onMouseMove);
      }
    }
  }

  // 4. Loop de Animación (Simula useEffect [isInViewport, reduceMotion] - CRÍTICO)
  $: {
    // Si la esfera no está lista, no hacemos nada.
    if (sphere && uniforms && renderer) {
        // Iniciar/Detener el loop
        if (!reduceMotion && isInViewport) {
            cancelAnimationFrame(animationFrame); 
            animateLoop(); // Inicia el loop
        } else {
            // Detiene el loop
            cancelAnimationFrame(animationFrame); 
            // Renderiza un frame estático si está dentro, pero con movimiento reducido
            if (reduceMotion && renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
    }
  }

  // -----------------------------------------------------------------
  // 🏁 CICLO DE VIDA (onMount / onDestroy)
  // -----------------------------------------------------------------

  onMount(() => {
    // 1. Setup inicial
    if (typeof window !== 'undefined') {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 2. Manejo de Contexto Perdido (Prevención de errores de THREE.WebGLRenderer: Context Lost)
    const handleContextLost = (event: Event) => {
        event.preventDefault(); 
        console.error("WebGL Context Lost. Cleaning up resources.");
        cancelAnimationFrame(animationFrame);
        // Aquí podrías destruir y recrear si la recuperación automática falla
    };

    // 3. Observers y Listeners
    const handleResize = () => {
      windowSize = { width: window.innerWidth, height: window.innerHeight };
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    canvasRef.addEventListener('webglcontextlost', handleContextLost);
    
    const observer = new IntersectionObserver(([entry]) => {
      isInViewport = entry.isIntersecting;
    });
    observer.observe(canvasRef);
    
    // 4. Inicialización de Three.js
    initThree();
    
    // Inicializar luces (trigger del primer $:)
    theme = theme; 

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrame);
      observer.unobserve(canvasRef);
      window.removeEventListener('resize', handleResize);
      canvasRef.removeEventListener('webglcontextlost', handleContextLost);
      if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
      cleanScene(scene);
      cleanRenderer(renderer);
    };
  });
</script>

<canvas 
    bind:this={canvasRef} 
    aria-hidden="true"
    class="w-full h-full absolute top-0 left-0 pointer-events-none" 
>
</canvas>

<style>
  /* Aquí puedes poner tus estilos CSS importados o Tailwind/Globales */
  canvas {
    z-index: -1; 
    min-height: 100vh;
    display: block;
    touch-action: none;
    /* transition: opacity 3s ease; -- Solo si deseas una transición de entrada -- */
  }
</style>