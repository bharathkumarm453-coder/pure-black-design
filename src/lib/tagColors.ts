// Deterministic color per tag string using a simple hash → HSL hue.
// Returns inline styles so we don't need to predeclare classes.

export interface TagColor {
  background: string;
  color: string;
  border: string;
  hue: number;
}

export function tagColor(tag: string): TagColor {
  const key = (tag || '').trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  return {
    background: `hsl(${hue} 75% 55% / 0.14)`,
    color: `hsl(${hue} 70% 42%)`,
    border: `hsl(${hue} 70% 50% / 0.35)`,
    hue,
  };
}
