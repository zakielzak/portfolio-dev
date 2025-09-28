import { animate } from "motion";

export function textScramble(
  element: HTMLElement,
  options: {
    duration?: number;
    speed?: number;
    characterSet?: string;
    delay?: number; // Nuevo parámetro para el retraso
  } = {}
): void {
  const {
    duration = 2,
    speed = 0.05,
    characterSet = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリ",
    delay = 0, // Valor por defecto: sin retraso
  } = options;

  const originalText = element.textContent || "";
  const totalSteps = Math.floor(duration / speed);

  // Función que inicia la animación después del delay
  const startAnimation = () => {
    animate(0, totalSteps, {
      duration: duration,
      ease: "linear",
      onUpdate: (latestProgressStep: number) => {
        const currentStep = Math.floor(latestProgressStep);
        let scrambledText = "";
        const progress = currentStep / totalSteps;

        for (let i = 0; i < originalText.length; i++) {
          if (originalText[i] === " ") {
            scrambledText += " ";
            continue;
          }

          if (progress * originalText.length > i) {
            scrambledText += originalText[i];
          } else {
            scrambledText +=
              characterSet[Math.floor(Math.random() * characterSet.length)];
          }
        }
        element.textContent = scrambledText;
      },
      onComplete: () => {
        element.textContent = originalText;
      },
    });
  };

  // Aplicar el delay si es necesario
  if (delay > 0) {
    setTimeout(startAnimation, delay * 1000); // Convertir a milisegundos
  } else {
    startAnimation();
  }
}
