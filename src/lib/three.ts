import { Cache, TextureLoader } from "three";
import { DRACOLoader, GLTFLoader } from "three-stdlib";

// Enable caching for all loaders
Cache.enabled = true;

const dracoLoader = new DRACOLoader();
const gltfLoader = new GLTFLoader();
dracoLoader.setDecoderPath("/draco/");
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * GLTF model loader configured with draco decoder
 */
export const modelLoader = gltfLoader;
export const textureLoader = new TextureLoader();

/**
 * Clean up a scene's materials and geometry
 */
export const cleanScene = (scene: { traverse: (arg0: (object: any) => void) => void; }) => {
  scene?.traverse((object) => {
    if (!object.isMesh) return;

    object.geometry.dispose();

    if (object.material.isMaterial) {
      cleanMaterial(object.material);
    } else {
      for (const material of object.material) {
        cleanMaterial(material);
      }
    }
  });
};

/**
 * Clean up and dispose of a material
 */
export const cleanMaterial = (material: { [x: string]: any; dispose?: any; }) => {
  material.dispose();

  for (const key of Object.keys(material)) {
    const value = material[key];
    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();

      // Close GLTF bitmap textures
      value.source?.data?.close?.();
    }
  }
};

/**
 * Clean up and dispose of a renderer
 */
export const cleanRenderer = (renderer: { dispose: () => void; } | null) => {
  renderer?.dispose();
  renderer = null;
};

/**
 * Clean up lights by removing them from their parent
 */
export const removeLights = (lights: any) => {
  for (const light of lights) {
    light.parent.remove(light);
  }
};

/**
 * Get child by name
 */
export const getChild = (name: any, object: { traverse: (arg0: (child: any) => void) => void; }) => {
  let node;

  object.traverse((child: { name: any; }) => {
    if (child.name === name) {
      node = child;
    }
  });

  return node;
};

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T {
  let lastRan: number | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return function (this: any, ...args: any[]) {
    const context = this;
    // Si no se ha ejecutado nunca, o ha pasado suficiente tiempo
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      // Limpiar el timeout anterior para evitar llamadas en exceso
      if (timeout) clearTimeout(timeout);

      // Establecer un nuevo timeout para ejecutar al final del límite
      timeout = setTimeout(() => {
        if (Date.now() - (lastRan || 0) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - (lastRan || 0)));
    }
  } as T;
}