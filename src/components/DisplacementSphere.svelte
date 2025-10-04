

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import {
    AmbientLight, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshPhongMaterial,
    PerspectiveCamera, Scene, SphereGeometry, UniformsUtils, Vector2, WebGLRenderer,
    Object3D,
  } from 'three';
  
  // Utilidades (debes asegurarte que $lib/threeUtils exista y contenga throttle)
  import { cleanRenderer, cleanScene, removeLights, throttle } from '../lib/three';
  
  // Shaders
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
  let onMouseMove: ((event: MouseEvent) => void) | undefined;
  
  // Función para inicializar Three.js (puede ser llamada de nuevo si el contexto se pierde)
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

    // 2. Camera y Scene
    camera = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 52; 
    scene = new Scene(); 

    // 3. Material y Shaders
    material = new MeshPhongMaterial();
    material.onBeforeCompile = shader => { 
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

    // 🔑 CLAVE: Forzar el primer render para ejecutar onBeforeCompile y llenar 'uniforms'
    renderer.render(scene, camera);
  }

  // -----------------------------------------------------------------
  // 🛠️ FUNCIÓN DE ANIMACIÓN
  // -----------------------------------------------------------------
  const animateLoop = () => { 
    if (!sphere || !uniforms || !renderer || !camera) {
        cancelAnimationFrame(animationFrame);
        return;
    }

    uniforms.time.value = 0.00005 * (Date.now() - start); 

    sphere.rotation.z += 0.0006; 
    sphere.rotation.x = $rotationX; 
    sphere.rotation.y = $rotationY; 

    renderer.render(scene, camera); 
    animationFrame = requestAnimationFrame(animateLoop); 
  }; 

  // -----------------------------------------------------------------
  // $ REACCIONES REACTIVAS
  // -----------------------------------------------------------------

  // 1. Luces / Tema (CORRECCIÓN: Se crean siempre que scene exista)
  $: {
    if (scene) { 
        if (lights.length > 0) {
            removeLights(lights);
        }
        
        const dirLightIntensity = theme === 'light' ? 1.8 : 2.0;
        const ambientLightIntensity = theme === 'light' ? 2.7 : 0.4;

        const dirLight = new DirectionalLight(0xffffff, dirLightIntensity);
        const ambientLight = new AmbientLight(0xffffff, ambientLightIntensity);

        dirLight.position.z = 200;
        dirLight.position.x = 100;
        dirLight.position.y = 100;

        lights = [dirLight, ambientLight];
        lights.forEach(light => scene.add(light));
    }
  }

  // 2. Resize / Posición de Esfera
  $: {
    if (renderer && camera && sphere && windowSize.width && media) {
      const { width, height } = windowSize;
      const adjustedHeight = height + height * 0.3;
      
      renderer.setSize(width, adjustedHeight);
      camera.aspect = width / adjustedHeight;
      camera.updateProjectionMatrix();

      // Ajuste de posición (Media Queries)
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

  // 3. Mouse Move
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

  // 4. Loop de Animación (CORRECCIÓN VITAL: Iniciar/Detener)
  $: {
    if (sphere && uniforms && renderer) {
        if (!reduceMotion && isInViewport) {
            cancelAnimationFrame(animationFrame); 
            animateLoop(); // Inicia el loop
        } else {
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
    // 1. Setup inicial y Reduced Motion
    if (typeof window !== 'undefined') {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // 2. Manejo de Contexto Perdido
    const handleContextLost = (event: Event) => {
        event.preventDefault(); 
        console.error("WebGL Context Lost. Resources cleaned up.");
        cancelAnimationFrame(animationFrame); 
    };
    canvasRef.addEventListener('webglcontextlost', handleContextLost);

    // 3. Observers de ventana y vista
    const handleResize = () => {
      windowSize = { width: window.innerWidth, height: window.innerHeight };
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    
    const observer = new IntersectionObserver(([entry]) => {
      isInViewport = entry.isIntersecting;
    });
    observer.observe(canvasRef);
    
    // 4. Inicialización de Three.js
    initThree();
    
    // Disparar la lógica de luces y posición inicial por reactividad
    theme = theme; 
    windowSize = windowSize; 

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
  canvas {
    z-index: -1; 
    min-height: 100vh;
    display: block;
    touch-action: none;
  }
</style>