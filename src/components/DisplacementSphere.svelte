

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import {
    AmbientLight, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshPhongMaterial,
    PerspectiveCamera, Scene, SphereGeometry, UniformsUtils, Vector2, WebGLRenderer,
    Object3D,
  } from 'three';
  
  import { cleanRenderer, cleanScene, removeLights, throttle } from '../lib/three';
  
  // Shaders
  import fragmentShader from './displacement-sphere-fragment.glsl?raw';
  import vertexShader from './displacement-sphere-vertex.glsl?raw';

  const rotationX = writable(0);
  const rotationY = writable(0);

  export let theme: 'light' | 'dark' = 'dark';
  export let media: { mobile: number; tablet: number };

  let canvasRef: HTMLCanvasElement;
  let renderer: WebGLRenderer;
  let camera: PerspectiveCamera;
  let scene: Scene;
  let lights: (AmbientLight | DirectionalLight)[] = [];
  let uniforms: { [uniform: string]: any } = {};
  let material: MeshPhongMaterial;
  let geometry: SphereGeometry;
  let sphere: Mesh;


  let reduceMotion = false;
  let isInViewport = false;
  let windowSize = { width: 0, height: 0 };
  let animationFrame: number;
  const start = Date.now();
  let onMouseMove: ((event: MouseEvent) => void) | undefined;
  
  // Three.js 
  const initThree = () => {
    const { innerWidth, innerHeight } = window;
    
    // Renderer
    renderer = new WebGLRenderer({ 
      canvas: canvasRef, antialias: false, alpha: true,
      powerPreference: 'high-performance', failIfMajorPerformanceCaveat: true,
    });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = LinearSRGBColorSpace; 

    // Camera & Scene
    camera = new PerspectiveCamera(54, innerWidth / innerHeight, 0.1, 100);
    camera.position.z = 52; 
    scene = new Scene(); 

    // Material & Shaders
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

    geometry = new SphereGeometry(32, 128, 128); 
    sphere = new Mesh(geometry, material); 
    sphere.position.z = 0; 
    (sphere as Object3D & { modifier?: number }).modifier = Math.random(); 
    scene.add(sphere);

  
    renderer.render(scene, camera);
  }

  const animateLoop = () => { 
    if (!sphere || !uniforms || !renderer || !camera) {
        cancelAnimationFrame(animationFrame);
        return;
    }

    uniforms.time.value = 0.00005 * (Date.now() - start); 

    sphere.rotation.z += 0.0003; 
    sphere.rotation.x = $rotationX; 
    sphere.rotation.y = $rotationY; 

    renderer.render(scene, camera); 
    animationFrame = requestAnimationFrame(animateLoop); 
  }; 


  $: {
    if (scene) { 
        if (lights.length > 0) {
            removeLights(lights);
        }
        
        const dirLightIntensity = theme === 'light' ? 1.5 : 2.0;
        const ambientLightIntensity = theme === 'light' ? 2.4 : 0.5;

        const dirLight = new DirectionalLight(0xffffff, dirLightIntensity);
        const ambientLight = new AmbientLight(0xffffff, ambientLightIntensity);

        dirLight.position.z = 200;
        dirLight.position.x = 100;
        dirLight.position.y = 100;

        lights = [dirLight, ambientLight];
        lights.forEach(light => scene.add(light));
    }
  }

  // Position
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

  // Mouse Move
 /*  $: {
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
  } */

  // Loop 
  $: {
    if (sphere && uniforms && renderer) {
        if (!reduceMotion && isInViewport) {
            cancelAnimationFrame(animationFrame); 
            animateLoop(); // Inicia el loop
        } else {
            cancelAnimationFrame(animationFrame); 
            if (reduceMotion && renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
    }
  }

  onMount(() => {
    if (typeof window !== 'undefined') {
      reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    const handleContextLost = (event: Event) => {
        event.preventDefault(); 
        console.error("WebGL Context Lost. Resources cleaned up.");
        cancelAnimationFrame(animationFrame); 
    };
    canvasRef.addEventListener('webglcontextlost', handleContextLost);

    const handleResize = () => {
      windowSize = { width: window.innerWidth, height: window.innerHeight };
    };
    handleResize(); 
    window.addEventListener('resize', handleResize);
    
    const observer = new IntersectionObserver(([entry]) => {
      isInViewport = entry.isIntersecting;
    });
    observer.observe(canvasRef);
    
    initThree();
    
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
    class="absolute inset-0 pointer-events-none" 
>
</canvas>

<style>
  
</style>