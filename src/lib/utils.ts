import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Lenis from "lenis";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const initLenis = () => {
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.05, // Smoother scrolling 
    smoothWheel: true,
    wheelMultiplier: 0.8, // Adjust scroll speed 
  });

  lenis.on("scroll", (e: any) => {
    console.log(e);
  });

  return lenis;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
