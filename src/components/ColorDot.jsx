import React from 'react';

/**
 * ColorDot Component
 * A button that displays a color dot with optional selection indicator
 * Used in color picker interfaces
 * 
 * Color definitions must match LIGHT_COLORS and DARK_COLORS from App.jsx
 */
function bgFor(color, dark) {
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  // Return the base rgba color string (with default opacity 0.6)
  return colors[color] || colors.default;
}

function solid(colorVal) {
  // Remove opacity from rgba color to get solid color
  if (!colorVal || typeof colorVal !== 'string') return colorVal;
  return colorVal.replace(/0\.[0-9]+\)$/, "1)");
}

// Import color definitions from main app to ensure consistency
const LIGHT_COLORS = {
  default: "rgba(255, 255, 255, 0.6)",
  red: "rgba(252, 165, 165, 0.6)",
  yellow: "rgba(253, 224, 71, 0.6)",
  green: "rgba(134, 239, 172, 0.6)",
  blue: "rgba(147, 197, 253, 0.6)",
  purple: "rgba(196, 181, 253, 0.6)",

  peach: "rgba(255, 183, 178, 0.6)",
  sage: "rgba(197, 219, 199, 0.6)",
  mint: "rgba(183, 234, 211, 0.6)",
  sky: "rgba(189, 224, 254, 0.6)",
  sand: "rgba(240, 219, 182, 0.6)",
  mauve: "rgba(220, 198, 224, 0.6)",
};
const DARK_COLORS = {
  default: "rgba(40, 40, 40, 0.6)",
  red: "rgba(153, 27, 27, 0.6)",
  yellow: "rgba(154, 117, 21, 0.6)",
  green: "rgba(22, 101, 52, 0.6)",
  blue: "rgba(30, 64, 175, 0.6)",
  purple: "rgba(76, 29, 149, 0.6)",

  peach: "rgba(191, 90, 71, 0.6)",
  sage: "rgba(54, 83, 64, 0.6)",
  mint: "rgba(32, 102, 77, 0.6)",
  sky: "rgba(30, 91, 150, 0.6)",
  sand: "rgba(140, 108, 66, 0.6)",
  mauve: "rgba(98, 74, 112, 0.6)",
};

export const ColorDot = ({ name, selected, onClick, darkMode }) => (
  <button
    type="button"
    onClick={onClick}
    title={name}
    className={`w-6 h-6 rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${name === "default" ? "flex items-center justify-center" : ""} ${selected ? "ring-2 ring-accent" : ""}`}
    style={{
      backgroundColor: name === "default" ? "transparent" : solid(bgFor(name, darkMode)),
      borderColor: name === "default" ? "#d1d5db" : "transparent",
    }}
  >
    {name === "default" && (
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: darkMode ? "#1f2937" : "#fff" }} />
    )}
  </button>
);

export default ColorDot;