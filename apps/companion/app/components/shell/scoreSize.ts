/** The rail's score steps down the type scale by length, so 112–108 still fits a 320 tab (DESIGN §2). */
export function scoreSize(score: string): "text-lg" | "text-base" | "text-sm" {
  if (score.length <= 5) return "text-lg";
  return score.length === 6 ? "text-base" : "text-sm";
}
