import { animate, delay as motionDelay, inView } from "motion";

type ScrambleOptions = {
  duration?: number;
  speed?: number;
  characterSet?: string;
  delay?: number;
  tickRate?: number;
  once?: boolean;
};

const DEFAULTS = {
  duration: 2,
  speed: 0.05,
  characterSet:
    "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン",
  delay: 0,
  tickRate: 3,
  once: true,
};

const reducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function textScramble(el: HTMLElement, opts: ScrambleOptions = {}) {
  const {
    duration = DEFAULTS.duration,
    speed = DEFAULTS.speed,
    characterSet = DEFAULTS.characterSet,
    delay = DEFAULTS.delay,
    tickRate = DEFAULTS.tickRate,
  } = opts;

  const originalText = el.textContent ?? "";
  if (!originalText.trim()) return { stop: () => {} };
  if (reducedMotion()) {
    el.textContent = originalText;
    return { stop: () => {} };
  }

  const steps = Math.floor(duration / speed);
  if (steps <= 0) {
    el.textContent = originalText;
    return { stop: () => {} };
  }

  let anim: ReturnType<typeof animate> | null = null;
  let tCancel: (() => void) | null = null;
  const lastChar: string[] = Array(originalText.length).fill("");

  const start = () => {
    el.setAttribute("aria-busy", "true");
    anim = animate(0, steps, {
      duration,
      ease: "linear",
      onUpdate: (latest: number) => {
        const curr = Math.floor(latest);
        const ratio = curr / steps;
        const scrambleNow = curr % tickRate === 0;

        let out = "";
        for (let i = 0; i < originalText.length; i++) {
          const ch = originalText[i];
          if (ch === " " || ch === "\n") {
            out += ch;
            continue;
          }
          if (ratio * originalText.length > i) {
            out += ch;
          } else {
            let scrambled = lastChar[i];
            if (scrambleNow) {
              scrambled =
                characterSet[Math.floor(Math.random() * characterSet.length)];
              lastChar[i] = scrambled;
            }
            out += scrambled;
          }
        }
        el.textContent = out;
      },
      onComplete: () => {
        el.textContent = originalText;
        el.setAttribute("aria-busy", "false");
      },
    });
  };

  if (delay > 0) tCancel = motionDelay(start, delay);
  else start();

  return {
    stop: () => {
      if (tCancel) tCancel();
      if (anim) anim.stop();
      el.textContent = originalText;
      el.setAttribute("aria-busy", "false");
    },
  };
}

export function initScramble(root: Document | HTMLElement = document): void {
  const nodes = root.querySelectorAll<HTMLElement>("[data-scramble]");
  if (!nodes.length) return;

  nodes.forEach((el) => {
    const opts: ScrambleOptions = {
      duration: Number(el.dataset.scrambleDuration) || undefined,
      speed: Number(el.dataset.scrambleSpeed) || undefined,
      characterSet: el.dataset.scrambleChars || undefined,
      delay: Number(el.dataset.scrambleDelay) || undefined,
      tickRate: Number(el.dataset.scrambleTickRate) || undefined,
      once: el.dataset.scrambleOnce !== "false",
    };

    inView(
      el,
      () => {
         const {stop} = textScramble(el as HTMLElement, opts);
         return opts.once ? () => {} : () => stop();
      },
      { margin: "0px 0px -15% 0px", amount: 0.4 }
    );
  });
}

typeof window !== "undefined" && initScramble();