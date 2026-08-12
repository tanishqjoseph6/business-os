export type KairosState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success"
  | "error"
  | "completed";

export const KAIROS_THINKING_MESSAGES = [
  "Kairos is thinking…",
  "Analyzing your workspace…",
  "Finding the best solution…",
  "Understanding your request…",
] as const;

export const KAIROS_WELCOME = {
  greeting: "Tell Kairos what needs to get done.",
  subtitle: "Your AI Business Copilot",
  body: "Your AI business copilot can analyze, create, schedule, organize and execute across VanderBase.",
} as const;

export const KAIROS_TAGLINE = "Your AI Business Copilot";

export function kairosStateLabel(state: KairosState): string | null {
  switch (state) {
    case "listening":
      return "Listening…";
    case "thinking":
      return null;
    case "speaking":
      return "Speaking…";
    case "success":
      return "Done";
    case "error":
      return "Something needs attention";
    case "completed":
      return "Ready when you are";
    default:
      return null;
  }
}
