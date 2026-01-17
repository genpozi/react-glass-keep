/**
 * Utility functions for Glass Keep
 * Reusable helper functions used across components
 */

/** ---------- API Helpers ---------- */
export const API_BASE = "/api";
export const AUTH_KEY = "glass-keep-auth";

/** ---------- Color & Transparency Constants ---------- */
export const LIGHT_COLORS = {
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

export const DARK_COLORS = {
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
  mauve: "rgba(88, 59, 104, 0.6)",
};

export const COLOR_ORDER = [
  "default", "red", "yellow", "green", "blue", "purple",
  "peach", "sage", "mint", "sky", "sand", "mauve"
];

export const TRANSPARENCY_PRESETS = [
  { id: 'solid', name: 'Solid', opacity: 0.95 },
  { id: 'subtle', name: 'Subtle Glass', opacity: 0.8 },
  { id: 'medium', name: 'Medium Glass', opacity: 0.6 },
  { id: 'frosted', name: 'Frosted', opacity: 0.4 },
  { id: 'airy', name: 'Airy', opacity: 0.25 },
];

/**
 * Get background color for a note
 * @param {string} colorName - Color name key
 * @param {boolean} dark - Whether dark mode is active
 * @param {string} transparencyId - Transparency preset ID
 * @returns {string} RGBA color string
 */
export const bgFor = (colorName, dark, transparencyId) => {
  const base = dark ? (DARK_COLORS[colorName] || DARK_COLORS.default) : (LIGHT_COLORS[colorName] || LIGHT_COLORS.default);
  if (!transparencyId) return base;
  const opacity = getOpacity(transparencyId, TRANSPARENCY_PRESETS);
  return applyOpacity(base, opacity);
};

/**
 * Get background color for modal (boosted lightness/darkness)
 * @param {string} colorName - Color name key
 * @param {boolean} dark - Whether dark mode is active
 * @returns {string} RGBA color string
 */
export const modalBgFor = (colorName, dark) => {
  const base = dark ? (DARK_COLORS[colorName] || DARK_COLORS.default) : (LIGHT_COLORS[colorName] || LIGHT_COLORS.default);
  return dark ? applyOpacity(base, 0.95) : mixWithWhite(base, 0.8, 0.92);
};

/**
 * Convert markdown to plain text
 * @param {string} md - Markdown content
 * @returns {string} Plain text
 */
export const mdToPlain = (md) => {
  try {
    const html = marked.parse(md || "");
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    return text.replace(/\n{3,}/g, "\n\n");
  } catch (e) {
    return md || "";
  }
};

/**
 * Enhanced API fetch wrapper with timeout, token handling and automatic logout
 * @param {string} path - API endpoint path
 * @param {Object} options - Fetch options (method, body, token)
 * @returns {Promise<any>} API response
 */
export async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 204) return null;
    let data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    // Handle token expiration (401 Unauthorized)
    if (res.status === 401) {
      try {
        localStorage.removeItem(AUTH_KEY);
      } catch (e) {
        console.error("Error clearing auth:", e);
      }

      // Dispatch a custom event so the app can handle it
      window.dispatchEvent(new CustomEvent('auth-expired'));

      const err = new Error(data?.error || "Session expired. Please log in again.");
      err.status = res.status;
      err.isAuthError = true;
      throw err;
    }

    if (!res.ok) {
      const err = new Error(data?.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const err = new Error("Request timeout. Please check your connection.");
      err.status = 408;
      err.isNetworkError = true;
      throw err;
    }

    if (error.isAuthError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      const err = new Error("Network error. Please check your connection.");
      err.status = 0;
      err.isNetworkError = true;
      throw err;
    }

    throw error;
  }
}

/**
 * Generate unique identifier
 * @returns {string} Unique ID string
 */
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Format edited timestamp to human-readable string
 * @param {string} iso - ISO date string
 * @returns {string} Formatted timestamp (e.g., "Today, 2:30 PM", "Yesterday, 2:30 PM", "Jan 15, '24")
 */
export function formatEditedStamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();

  const sameYMD = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (sameYMD(d, now)) return `Today, ${timeStr}`;
  const yest = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (sameYMD(d, yest)) return `Yesterday, ${timeStr}`;

  const month = d.toLocaleString([], { month: "short" });
  const day = d.getDate();
  if (d.getFullYear() === now.getFullYear()) return `${month} ${day}`;
  const yy = String(d.getFullYear()).slice(-2);
  return `${month} ${day}, '${yy}`;
}

/**
 * Sanitize filename for download
 * @param {string} name - Original filename
 * @param {string} fallback - Fallback filename if name is empty
 * @returns {string} Sanitized filename safe for filesystem
 */
export const sanitizeFilename = (name, fallback = "note") =>
  (name || fallback).toString().trim().replace(/[\/\\?%*:|"<>]/g, "-").slice(0, 64);

/**
 * Download text content as file
 * @param {string} filename - Download filename
 * @param {string} content - File content
 */
export const downloadText = (filename, content) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
};

/**
 * Download data URL as file
 * @param {string} filename - Download filename
 * @param {string} dataUrl - Data URL to download
 */
export const downloadDataUrl = async (filename, dataUrl) => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

/**
 * Download arbitrary blob as file
 * @param {string} filename - Download filename
 * @param {Blob} blob - Blob to download
 */
export const triggerBlobDownload = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
};

/**
 * Get file extension from data URL
 * @param {string} dataUrl - Data URL
 * @returns {string} File extension (e.g., "jpg", "png", "webp", "gif")
 */
export const imageExtFromDataURL = (dataUrl) => {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(dataUrl || "");
  const mime = (m?.[1] || "image/jpeg").toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
};

/**
 * Normalize image filename with proper extension
 * @param {string} name - Original filename
 * @param {string} dataUrl - Data URL
 * @param {number} index - Image index (used in fallback name)
 * @returns {string} Normalized filename
 */
export const normalizeImageFilename = (name, dataUrl, index = 1) => {
  const base = sanitizeFilename(name && name.trim() ? name : `image-${index}`);
  const withoutExt = base.replace(/\.[^.]+$/, "");
  const ext = imageExtFromDataURL(dataUrl);
  return `${withoutExt}.${ext}`;
};

/**
 * Build markdown content for note download
 * @param {object} n - Note object
 * @returns {string} Markdown content
 */
export const mdForDownload = (n) => {
  const lines = [];
  if (n.title) lines.push(`# ${n.title}`, "");
  if (Array.isArray(n.tags) && n.tags.length) {
    lines.push(`**Tags:** ${n.tags.map((t) => `\`${t}\``).join(", ")}`, "");
  }
  if (n.type === "text") {
    lines.push(String(n.content || ""));
  } else {
    const items = Array.isArray(n.items) ? n.items : [];
    for (const it of items) {
      lines.push(`- [${it.done ? "x" : " "}] ${it.text || ""}`);
    }
  }
  if (n.images?.length) {
    lines.push(
      "",
      `> _${n.images.length} image(s) attached)_ ${n.images
        .map((im) => im.name || "image")
        .join(", ")}`
    );
  }
  lines.push("");
  return lines.join("\n");
};

/**
 * Compress image file to data URL
 * @param {File} file - Image file
 * @param {number} maxDim - Maximum dimension (default 1600)
 * @param {number} quality - JPEG quality 0-1 (default 0.85)
 * @returns {Promise<string>} Data URL of compressed image
 */
export async function fileToCompressedDataURL(file, maxDim = 1600, quality = 0.85) {
  const dataUrl = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * addImagesToState - Process files and add to state with IDs
 */
export async function addImagesToState(files, setter) {
  const results = [];
  for (const f of Array.from(files)) {
    try {
      const src = await fileToCompressedDataURL(f);
      results.push({ id: uid(), src, name: f.name });
    } catch (e) {
      console.error("Image processing error", e);
    }
  }
  if (results.length) setter((prev) => [...prev, ...results]);
}

/**
 * Lazy-load JSZip for generating ZIP files client-side
 * @returns {Promise<object>} JSZip instance
 */
export async function ensureJSZip() {
  if (window.JSZip) return window.JSZip;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load JSZip."));
    document.head.appendChild(s);
  });
  if (!window.JSZip) throw new Error("JSZip not available");
  return window.JSZip;
}

/**
 * Wrap selection in text with before/after markers
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @param {string} before - Text before selection
 * @param {string} after - Text after selection
 * @param {string} placeholder - Placeholder text if no selection
 * @returns {object} { text: newText, range: [newStart, newEnd] }
 */
export function wrapSelection(value, start, end, before, after, placeholder = "text") {
  const hasSel = start !== end;
  const sel = hasSel ? value.slice(start, end) : placeholder;
  const newText = value.slice(0, start) + before + sel + after + value.slice(end);
  const s = start + before.length;
  const e = s + sel.length;
  return { text: newText, range: [s, e] };
}

/**
 * Create fenced code block
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @returns {object} { text: newText, range: [newStart, newEnd] }
 */
export function fencedBlock(value, start, end) {
  const hasSel = start !== end;
  const sel = hasSel ? value.slice(start, end) : "code";
  const block = "```\n" + sel + "\n```";
  const newText = value.slice(0, start) + block + value.slice(end);
  const s = start + 4;
  const e = s + sel.length;
  return { text: newText, range: [s, e] };
}

/**
 * Get selection bounds (from start of line to end of line)
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @returns {object} { from: startOfLine, to: endOfLine }
 */
export function selectionBounds(value, start, end) {
  const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  return { from, to };
}

/**
 * Toggle list (unordered or ordered)
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @param {string} kind - 'ul' or 'ol'
 * @returns {object} { text: newText, range: [newStart, newEnd] }
 */
export function toggleList(value, start, end, kind) {
  const { from, to } = selectionBounds(value, start, end);
  const segment = value.slice(from, to);
  const lines = segment.split("\n");

  const isUL = (ln) => /^\s*[-*+]\s+/.test(ln);
  const isOL = (ln) => /^\s*\d+\.\s+/.test(ln);
  const nonEmpty = (ln) => ln.trim().length > 0;

  const allUL = lines.filter(nonEmpty).every(isUL);
  const allOL = lines.filter(nonEmpty).every(isOL);

  let newLines;
  if (kind === "ul") {
    if (allUL) newLines = lines.map((ln) => ln.replace(/^\s*[-*+]\s+/, ""));
    else newLines = lines.map((ln) => (nonEmpty(ln) ? `- ${ln.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "")}` : ln));
  } else {
    if (allOL) {
      newLines = lines.map((ln) => ln.replace(/^\s*\d+\.\s+/, ""));
    } else {
      let i = 1;
      newLines = lines.map((ln) =>
        nonEmpty(ln)
          ? `${i++}. ${ln.replace(/^\s*[-*+]\s+/, "").replace(/^\s*\d+\.\s+/, "")}`
          : ln
      );
    }
  }

  const replaced = newLines.join("\n");
  const newText = value.slice(0, from) + replaced + value.slice(to);
  const delta = replaced.length - segment.length;
  const newStart = start + (kind === "ol" && !allOL ? 3 : kind === "ul" && !allUL ? 2 : 0);
  const newEnd = end + delta;
  return { text: newText, range: [newStart, newEnd] };
}

/**
 * Prefix lines with markdown header markers
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @param {string} prefix - Markdown prefix (e.g., "# ", "## ", "> ")
 * @returns {object} { text: newText, range: [newStart, newEnd] }
 */
export function prefixLines(value, start, end, prefix) {
  const { from, to } = selectionBounds(value, start, end);
  const segment = value.slice(from, to);
  const lines = segment.split("\n").map((ln) => `${prefix}${ln}`);
  const replaced = lines.join("\n");
  const newText = value.slice(0, from) + replaced + value.slice(to);
  const delta = replaced.length - segment.length;
  return { text: newText, range: [start + prefix.length, end + delta] };
}

/**
 * Handle smart Enter (continue lists/quotes, or exit on empty)
 * @param {string} value - Text value
 * @param {number} start - Selection start index
 * @param {number} end - Selection end index
 * @returns {object|null} { text: newText, range: [caret, caret] } or null
 */
export function handleSmartEnter(value, start, end) {
  if (start !== end) return null;
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const line = value.slice(lineStart, start);
  const before = value.slice(0, start);
  const after = value.slice(end);

  // Ordered list?
  let m = /^(\s*)(\d+)\.\s(.*)$/.exec(line);
  if (m) {
    const indent = m[1] || "";
    const num = parseInt(m[2], 10) || 1;
    const text = m[3] || "";
    if (text.trim() === "") {
      const newBefore = value.slice(0, lineStart);
      const newText = newBefore + "\n" + after;
      const caret = newBefore.length + 1;
      return { text: newText, range: [caret, caret] };
    } else {
      const prefix = `${indent}${num + 1}. `;
      const newText = before + "\n" + prefix + after;
      const caret = start + 1 + prefix.length;
      return { text: newText, range: [caret, caret] };
    }
  }

  // Unordered list?
  m = /^(\s*)([-*+])\s(.*)$/.exec(line);
  if (m) {
    const indent = m[1] || "";
    const text = m[3] || "";
    if (text.trim() === "") {
      const newBefore = value.slice(0, lineStart);
      const newText = newBefore + "\n" + after;
      const caret = newBefore.length + 1;
      return { text: newText, range: [caret, caret] };
    } else {
      const prefix = `${indent}- `;
      const newText = before + "\n" + prefix + after;
      const caret = start + 1 + prefix.length;
      return { text: newText, range: [caret, caret] };
    }
  }

  // Blockquote?
  m = /^(\s*)>\s?(.*)$/.exec(line);
  if (m) {
    const indent = m[1] || "";
    const text = m[2] || "";
    if (text.trim() === "") {
      const newBefore = value.slice(0, lineStart);
      const newText = newBefore + "\n" + after;
      const caret = newBefore.length + 1;
      return { text: newText, range: [caret, caret] };
    } else {
      const prefix = `${indent}> `;
      const newText = before + "\n" + prefix + after;
      const caret = start + 1 + prefix.length;
      return { text: newText, range: [caret, caret] };
    }
  }

  return null;
}

/**
 * Run formatting operation on text
 * @param {Function} getter - Function to get current value
 * @param {Function} setter - Function to set new value
 * @param {object} ref - Textarea ref
 * @param {string} type - Format type (e.g., "bold", "italic", "h1", etc.)
 */
export function runFormat(getter, setter, ref, type) {
  const el = ref.current;
  if (!el) return;
  const value = getter();
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;

  // Insert defaults when editor is empty for quote / ul / ol
  if ((type === "ul" || type === "ol" || type === "quote") && value.trim().length === 0) {
    const snippet = type === "ul" ? "- " : type === "ol" ? "1. " : "> ";
    setter(snippet);
    requestAnimationFrame(() => {
      el.focus();
      try { el.setSelectionRange(snippet.length, snippet.length); } catch (e) { }
    });
    return;
  }

  // Handle list formatting when no text is selected
  if ((type === "ul" || type === "ol") && start === end) {
    const snippet = type === "ul" ? "- " : "1. ";
    const newValue = value.slice(0, start) + snippet + value.slice(end);
    setter(newValue);
    requestAnimationFrame(() => {
      el.focus();
      try { el.setSelectionRange(start + snippet.length, start + snippet.length); } catch (e) { }
    });
    return;
  }

  let result;
  switch (type) {
    case "h1": result = prefixLines(value, start, end, "# "); break;
    case "h2": result = prefixLines(value, start, end, "## "); break;
    case "h3": result = prefixLines(value, start, end, "### "); break;
    case "bold": result = wrapSelection(value, start, end, "**", "**"); break;
    case "italic": result = wrapSelection(value, start, end, "_", "_"); break;
    case "strike": result = wrapSelection(value, start, end, "~~", "~~"); break;
    case "code": result = wrapSelection(value, start, end, "`", "`"); break;
    case "codeblock": result = fencedBlock(value, start, end); break;
    case "quote": result = prefixLines(value, start, end, "> "); break;
    case "ul": result = toggleList(value, start, end, "ul"); break;
    case "ol": result = toggleList(value, start, end, "ol"); break;
    case "link": result = wrapSelection(value, start, end, "[", "](https://)"); break;
    default: return;
  }
  setter(result.text);
  requestAnimationFrame(() => {
    el.focus();
    try {
      el.setSelectionRange(result.range[0], result.range[1]);
    } catch (e) { }
  });
}

/**
 * Mark text selection
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @param {number} start - Selection start
 * @param {number} end - Selection end
 */
export function setSelectionRange(textarea, start, end) {
  if (!textarea) return;
  try {
    textarea.focus();
    textarea.setSelectionRange(start, end);
  } catch (e) {
    console.error("Failed to set selection range:", e);
  }
}

/**
 * Scroll textarea selection into view
 * @param {HTMLTextAreaElement} textarea - Textarea element
 * @param {HTMLElement} scrollEl - Scroll container element
 */
export function scrollSelectionIntoView(textarea, scrollEl) {
  if (!textarea) return;
  const scrollTop = scrollEl?.scrollTop || 0;
  try {
    textarea.focus();
    textarea.setSelectionRange(textarea.selectionStart ?? textarea.value.length, textarea.selectionEnd ?? textarea.value.length);
    if (scrollEl) {
      scrollEl.scrollTop = scrollTop;
    }
  } catch (e) {
    console.error("Failed to scroll selection into view:", e);
  }
}

/**
 * Parse RGBA string to components
 * @param {string} str - RGBA string
 * @returns {object} { r: number, g: number, b: number, a: number }
 */
export function parseRGBA(str) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/.exec(str || "");
  if (!m) return { r: 255, g: 255, b: 255, a: 0.85 };
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 };
}

/**
 * Mix color with white for modal light boost
 * @param {string} rgbaStr - RGBA color string
 * @param {number} whiteRatio - White mix ratio (0-1)
 * @param {number} outAlpha - Output alpha
 * @returns {string} Mixed RGBA color
 */
export function mixWithWhite(rgbaStr, whiteRatio = 0.8, outAlpha = 0.92) {
  const { r, g, b } = parseRGBA(rgbaStr);
  const rr = Math.round(255 * whiteRatio + r * (1 - whiteRatio));
  const gg = Math.round(255 * whiteRatio + g * (1 - whiteRatio));
  const bb = Math.round(255 * whiteRatio + b * (1 - whiteRatio));
  return `rgba(${rr}, ${gg}, ${bb}, ${outAlpha})`;
}

/**
 * Remove opacity from rgba color string
 * @param {string} rgba - RGBA color string
 * @returns {string} Solid color (rgba replaced with 1)
 */
export const solid = (rgba) => (typeof rgba === "string" ? rgba.replace(/0\.[0-9]+\)$/, "1)") : rgba);

/**
 * Get opacity value from transparency preset ID
 * @param {string} transparencyId - Transparency preset ID
 * @param {Array} presets - Transparency presets array
 * @returns {number} Opacity value (0-1)
 */
export const getOpacity = (transparencyId, presets) => {
  const preset = presets.find(p => p.id === transparencyId);
  return preset ? preset.opacity : 0.6; // default to medium
};

/**
 * Apply custom opacity to a color string
 * @param {string} rgbaStr - RGBA color string
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} Color string with updated opacity
 */
export const applyOpacity = (rgbaStr, opacity) => {
  if (!rgbaStr || typeof rgbaStr !== 'string') return rgbaStr;
  return rgbaStr.replace(/[0-9.]+\)$/, `${opacity})`);
};

/**
 * Check if value is empty or null/undefined
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim().length === 0) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms (default 300)
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
};

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms (default 100)
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};export const ALL_IMAGES = "__ALL_IMAGES__";
