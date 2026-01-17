import React from 'react';

/**
 * FormatToolbar Component
 * Displays markdown formatting buttons (headings, bold, italic, code, etc.)
 * Used in text editors for quick formatting
 */
export function FormatToolbar({ dark, onAction }) {
  const base = `fmt-btn ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`;
  return (
    <div className={`fmt-pop ${dark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
      <div className="flex flex-wrap gap-1">
        <button className={base} onClick={() => onAction("h1")}>H1</button>
        <button className={base} onClick={() => onAction("h2")}>H2</button>
        <button className={base} onClick={() => onAction("h3")}>H3</button>
        <span className="mx-1 opacity-40">|</span>
        <button className={base} onClick={() => onAction("bold")}><strong>B</strong></button>
        <button className={base} onClick={() => onAction("italic")}><em>I</em></button>
        <button className={base} onClick={() => onAction("strike")}><span className="line-through">S</span></button>
        <button className={base} onClick={() => onAction("code")}>`code`</button>
        <button className={base} onClick={() => onAction("codeblock")}>&lt;/&gt;</button>
        <span className="mx-1 opacity-40">|</span>
        <button className={base} onClick={() => onAction("quote")}>&gt;</button>
        <button className={base} onClick={() => onAction("ul")}>• list</button>
        <button className={base} onClick={() => onAction("ol")}>1. list</button>
        <button className={base} onClick={() => onAction("link")}>🔗</button>
      </div>
    </div>
  );
}

export default FormatToolbar;
