import React, { useEffect, useMemo, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "./components/DashboardLayout";
import { SearchBar } from "./components/SearchBar";
import { NoteCard as NoteCardComponent } from "./components/NoteCard";
import Modal from "./components/Modal";
import { Composer } from "./components/Composer";
import { Popover } from "./components/Popover";
import { ColorDot } from "./components/ColorDot";
import { FormatToolbar } from "./components/FormatToolbar";
import { askAI } from "./ai";
import { marked as markedParser } from "marked";
import DrawingCanvas from "./DrawingCanvas";
import { BACKGROUNDS } from "./backgrounds";
import { ACCENT_COLORS, THEME_PRESETS } from "./themes";
import { useAuth, useNotes, useSettings, useUI, useModal } from "./contexts";
import { useCollaboration, useAdmin } from "./hooks";
import {
  uid, mdToPlain, mdForDownload, sanitizeFilename, downloadText, downloadDataUrl,
  triggerBlobDownload, imageExtFromDataURL, normalizeImageFilename, fileToCompressedDataURL,
  ensureJSZip, wrapSelection, fencedBlock, selectionBounds, toggleList, prefixLines,
  runFormat, resizeModalTextarea, parseRGBA, mixWithWhite, solid, bgFor,
  modalBgFor, getOpacity, applyOpacity, isEmpty, handleSmartEnter
} from "./utils/helpers";
import {
  PinOutline, PinFilled, Trash, CloseIcon, DownloadIcon,
  ArrowLeft, ArrowRight, Kebab, FormatIcon, ArchiveIcon,
  Sun, Moon, ImageIcon, GalleryIcon, Hamburger,
  SettingsIcon, GridIcon, ListIcon, SunIcon, MoonIcon,
  CheckSquareIcon, ShieldIcon, LogOutIcon, PinIcon, Sparkles
} from "./components/Icons";

// Ensure we can call marked.parse(...)
const marked =
  typeof markedParser === "function" ? { parse: markedParser } : markedParser;

/** ---------- Special tag filters ---------- */
const ALL_IMAGES = "__ALL_IMAGES__";

/** ---------- Special tag filters ---------- */
const ALL_IMAGES = "__ALL_IMAGES__";

/** ---------- Global CSS injection ---------- */
const globalCSS = `
:root {
  --bg-light: #f0f2f5;
  --bg-dark: #1a1a1a;
  --card-bg-light: rgba(255, 255, 255, 0.6);
  --card-bg-dark: rgba(40, 40, 40, 0.6);
  --text-light: #1f2937;
  --text-dark: #e5e7eb;
  --border-light: rgba(209, 213, 219, 0.3);
  --border-dark: rgba(75, 85, 99, 0.3);
}
html.dark {
  --bg-light: var(--bg-dark);
  --card-bg-light: var(--card-bg-dark);
  --text-light: var(--text-dark);
  --border-light: var(--border-dark);
}
body {
  background-color: var(--bg-light);
  color: var(--text-light);
  transition: background-color 0.3s ease, color 0.3s ease;
}
.glass-card {
  background-color: var(--card-bg-light);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
  break-inside: avoid;
}
.note-content p { margin-bottom: 0.5rem; }
.note-content h1, .note-content h2, .note-content h3 { margin-bottom: 0.75rem; font-weight: 600; }
.note-content h1 { font-size: 1.5rem; line-height: 1.3; }
.note-content h2 { font-size: 1.25rem; line-height: 1.35; }
.note-content h3 { font-size: 1.125rem; line-height: 1.4; }

/* NEW: Prevent long headings/URLs from overflowing, allow tables/code to scroll */
.note-content,
.note-content * { overflow-wrap: anywhere; word-break: break-word; }
.note-content pre { overflow: auto; }

/* Make pre relative so copy button can be positioned */
.note-content pre { position: relative; }

/* Wrapper for code blocks to anchor copy button outside scroll area */
.code-block-wrapper { position: relative; }
.code-block-wrapper .code-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
}

.note-content table { display: block; max-width: 100%; overflow-x: auto; }

/* Default lists (subtle spacing for inline previews) */
.note-content ul, .note-content ol { margin: 0.25rem 0 0.25rem 1.25rem; padding-left: 0.75rem; }
.note-content ul { list-style: disc; }
.note-content ol { list-style: decimal; }
.note-content li { margin: 0.15rem 0; line-height: 1.35; }

/* View-mode dense lists in modal: NO extra space between items */
.note-content--dense ul, .note-content--dense ol { margin: 0; padding-left: 1.1rem; }
.note-content--dense li { margin: 0; padding: 0; line-height: 1.15; }
.note-content--dense li > p { margin: 0; }
.note-content--dense li ul, .note-content--dense li ol { margin: 0.1rem 0 0 1.1rem; padding-left: 1.1rem; }

/* Hyperlinks in view mode */
.note-content a {
  color: #2563eb;
  text-decoration: underline;
}

/* Inline code and fenced code styling */
.note-content code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: rgba(0,0,0,0.06);
  padding: .12rem .35rem;
  border-radius: .35rem;
  border: 1px solid var(--border-light);
  font-size: .9em;
}

/* Fenced code block container (pre) */
.note-content pre {
  background: rgba(0,0,0,0.06);
  border: 1px solid var(--border-light);
  border-radius: .6rem;
  padding: .75rem .9rem;
}
/* Remove inner background on code inside pre */
.note-content pre code {
  border: none !important;
  background: transparent !important;
  padding: 0;
  display: block;
}

/* Copy buttons */
.note-content pre .code-copy-btn,
.code-block-wrapper .code-copy-btn {
  font-size: .75rem;
  padding: .2rem .45rem;
  border-radius: .35rem;
  background: #111;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 2px 10px rgba(0,0,0,0.25);
  opacity: 1;
  z-index: 2;
}
html:not(.dark) .note-content pre .code-copy-btn {
  background: #fff;
  color: #111;
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
}
  
.inline-code-copy-btn {
  margin-left: 6px;
  font-size: .7rem;
  padding: .05rem .35rem;
  border-radius: .35rem;
  border: 1px solid var(--border-light);
  background: rgba(0,0,0,0.06);
}

.dragging { opacity: 0.5; transform: scale(1.05); }
.drag-over { outline: 2px dashed rgba(99,102,241,.6); outline-offset: 6px; }
.masonry-grid { column-gap: 1.5rem; column-count: 1; }
@media (min-width: 640px) { .masonry-grid { column-count: 2; } }
@media (min-width: 768px) { .masonry-grid { column-count: 3; } }
@media (min-width: 1024px) { .masonry-grid { column-count: 4; } }
@media (min-width: 1280px) { .masonry-grid { column-count: 5; } }

/* New grid layout to place notes row-wise (left-to-right, top-to-bottom) */
/* Keep-like masonry using CSS Grid with JS-calculated row spans (preserves horizontal order) */
 
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.5); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.7); }

/* clamp for text preview */
.line-clamp-6 {
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* scrim blur */
.modal-scrim {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* modal header blur */
.modal-header-blur {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* formatting popover base */
.fmt-pop {
  border: 1px solid var(--border-light);
  border-radius: 0.75rem;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
  padding: .5rem;
}
.fmt-btn {
  padding: .35rem .5rem;
  border-radius: .5rem;
  font-size: .85rem;
}
`;

/** ---------- Image compression (client) ---------- */
async function fileToCompressedDataURL(file, maxDim = 1600, quality = 0.85) {
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

/** ---------- Shared UI pieces ---------- */

/** ---------- Formatting helpers ---------- */
function wrapSelection(value, start, end, before, after, placeholder = "text") {
  const hasSel = start !== end;
  const sel = hasSel ? value.slice(start, end) : placeholder;
  const newText = value.slice(0, start) + before + sel + after + value.slice(end);
  const s = start + before.length;
  const e = s + sel.length;
  return { text: newText, range: [s, e] };
}
function fencedBlock(value, start, end) {
  const hasSel = start !== end;
  const sel = hasSel ? value.slice(start, end) : "code";
  const block = "```\n" + sel + "\n```";
  const newText = value.slice(0, start) + block + value.slice(end);
  const s = start + 4;
  const e = s + sel.length;
  return { text: newText, range: [s, e] };
}
function selectionBounds(value, start, end) {
  const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  return { from, to };
}
function toggleList(value, start, end, kind /* 'ul' | 'ol' */) {
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
function prefixLines(value, start, end, prefix) {
  const { from, to } = selectionBounds(value, start, end);
  const segment = value.slice(from, to);
  const lines = segment.split("\n").map((ln) => `${prefix}${ln}`);
  const replaced = lines.join("\n");
  const newText = value.slice(0, from) + replaced + value.slice(to);
  const delta = replaced.length - segment.length;
  return { text: newText, range: [start + prefix.length, end + delta] };
}

/** Smart Enter: continue lists/quotes, or exit on empty */
function handleSmartEnter(value, start, end) {
  if (start !== end) return null; // only handle caret
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
      // exit list
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

/** Small toolbar UI */

/** ---------- Portal Popover ---------- */

/** ---------- Drawing Preview ---------- */

/** ---------- Note Card ---------- */
/** ---------- Auth Shell ---------- */
function AuthShell({ title, dark, onToggleDark, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Glass Keep</h1>
          <p className="text-gray-500 dark:text-gray-400">{title}</p>
        </div>
        <div className="glass-card rounded-xl p-6 shadow-lg">{children}</div>
        <div className="mt-6 text-center">
          <button
            onClick={onToggleDark}
            className={`inline-flex items-center gap-2 text-sm ${dark ? "text-gray-300" : "text-gray-700"} hover:underline`}
            title="Toggle dark mode"
          >
            {dark ? <Moon /> : <Sun />} Toggle theme
          </button>
        </div>
      </div>
    </div>
  );
}

/** ---------- Login / Register / Secret Login ---------- */
function LoginView({ dark, onToggleDark, onLogin, goRegister, goSecret, allowRegistration }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await onLogin(email.trim(), pw);
      if (!res.ok) setErr(res.error || "Login failed");
    } catch (er) {
      setErr(er.message || "Login failed");
    }
  };

  return (
    <AuthShell title="Sign in to your account" dark={dark} onToggleDark={onToggleDark}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          autoComplete="username"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover">
          Sign In
        </button>
      </form>

      <div className="mt-4 text-sm flex justify-between items-center">
        {allowRegistration && (
          <button className="text-accent hover:underline" onClick={goRegister}>
            Create account
          </button>
        )}
        <button className="text-accent hover:underline" onClick={goSecret}>
          Forgot username/password?
        </button>
      </div>
    </AuthShell>
  );
}

function RegisterView({ dark, onToggleDark, onRegister, goLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < 6) return setErr("Password must be at least 6 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    try {
      const res = await onRegister(name.trim() || "User", email.trim(), pw);
      if (!res.ok) setErr(res.error || "Registration failed");
    } catch (er) {
      setErr(er.message || "Registration failed");
    }
  };

  return (
    <AuthShell title="Create a new account" dark={dark} onToggleDark={onToggleDark}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          autoComplete="username"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Password (min 6 chars)"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Confirm password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover">
          Create Account
        </button>
      </form>
      <div className="mt-4 text-sm text-center">
        Already have an account?{" "}
        <button className="text-accent hover:underline" onClick={goLogin}>
          Sign in
        </button>
      </div>
    </AuthShell>
  );
}

function SecretLoginView({ dark, onToggleDark, onLoginWithKey, goLogin }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await onLoginWithKey(key.trim());
      if (!res.ok) setErr(res.error || "Login failed");
    } catch (er) {
      setErr(er.message || "Login failed");
    }
  };

  return (
    <AuthShell title="Sign in with Secret Key" dark={dark} onToggleDark={onToggleDark}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full bg-transparent border border-[var(--border-light)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent min-h-[100px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          placeholder="Paste your secret key here"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button type="submit" className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover">
          Sign In with Secret Key
        </button>
      </form>
      <div className="mt-4 text-sm text-center">
        Remember your credentials?{" "}
        <button className="text-accent hover:underline" onClick={goLogin}>
          Sign in with email & password
        </button>
      </div>
    </AuthShell>
  );
}

/** ---------- Tag Sidebar / Drawer ---------- */
function TagSidebar({ open, onClose, tagsWithCounts, activeTag, onSelect, dark, permanent = false, width = 288, onResize }) {
  const isAllNotes = activeTag === null;
  const isAllImages = activeTag === ALL_IMAGES;

  return (
    <>
      {open && !permanent && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-full shadow-2xl transition-transform duration-200 ${permanent || open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: permanent ? `${width}px` : '288px',
          backgroundColor: dark ? "#222222" : "rgba(255,255,255,0.95)",
          borderRight: "1px solid var(--border-light)"
        }}
        aria-hidden={!(permanent || open)}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tags</h3>
          {!permanent && (
            <button
              className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
              onClick={onClose}
              title="Close"
            >
              <CloseIcon />
            </button>
          )}
        </div>
        <nav className="p-2 overflow-y-auto h-[calc(100%-56px)]">
          {/* Notes (All) */}
          <button
            className={`w-full text-left px-3 py-2 rounded-md mb-1 ${isAllNotes ? (dark ? "bg-white/10" : "bg-black/5") : (dark ? "hover:bg-white/10" : "hover:bg-black/5")}`}
            onClick={() => { onSelect(null); onClose(); }}
          >
            Notes (All)
          </button>

          {/* All Images */}
          <button
            className={`w-full text-left px-3 py-2 rounded-md mb-2 ${isAllImages ? (dark ? "bg-white/10" : "bg-black/5") : (dark ? "hover:bg-white/10" : "hover:bg-black/5")}`}
            onClick={() => { onSelect(ALL_IMAGES); onClose(); }}
          >
            All Images
          </button>

          {/* Archived Notes */}
          <button
            className={`w-full text-left px-3 py-2 rounded-md mb-2 ${activeTag === 'ARCHIVED' ? (dark ? "bg-white/10" : "bg-black/5") : (dark ? "hover:bg-white/10" : "hover:bg-black/5")}`}
            onClick={() => { onSelect('ARCHIVED'); onClose(); }}
          >
            Archived Notes
          </button>

          {/* User tags */}
          {tagsWithCounts.map(({ tag, count }) => {
            const active = typeof activeTag === "string" && activeTag !== ALL_IMAGES &&
              activeTag.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between ${active ? (dark ? "bg-white/10" : "bg-black/5") : (dark ? "hover:bg-white/10" : "hover:bg-black/5")}`}
                onClick={() => { onSelect(tag); onClose(); }}
                title={tag}
              >
                <span className="truncate">{tag}</span>
                <span className="text-xs opacity-70">{count}</span>
              </button>
            );
          })}
          {tagsWithCounts.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No tags yet. Add tags to your notes!</p>
          )}
        </nav>

        {/* Resize handle - only show when permanent */}
        {permanent && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-accent/50 active:bg-accent transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = width;

              const handleMouseMove = (moveEvent) => {
                const newWidth = Math.max(200, Math.min(500, startWidth + (moveEvent.clientX - startX)));
                onResize(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = 'ew-resize';
              document.body.style.userSelect = 'none';
            }}
          />
        )}
      </aside>
    </>
  );
}

/** ---------- Settings Panel ---------- */
function SettingsPanel({ open, onClose, dark, onExportAll, onImportAll, onImportGKeep, onImportMd, onDownloadSecretKey, alwaysShowSidebarOnWide, setAlwaysShowSidebarOnWide, localAiEnabled, setLocalAiEnabled, showGenericConfirm, showToast, inline, backgroundImage, setBackgroundImage, backgroundOverlay, setBackgroundOverlay, accentColor, setAccentColor, cardTransparency, setCardTransparency }) {
  // Prevent body scroll when settings panel is open
  React.useEffect(() => {
    if (inline) return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, inline]);

  return (
    <>
      {open && !inline && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        />
      )}
      <div
        className={inline ? "w-full h-full" : `fixed top-0 right-0 z-50 h-full w-full sm:w-96 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={inline ? {} : { backgroundColor: dark ? "#222222" : "rgba(255,255,255,0.95)", borderLeft: "1px solid var(--border-light)" }}
        aria-hidden={!open && !inline}
      >
        {!inline && (
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-light)]">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <SettingsIcon />
            Settings
          </h3>
          <button
            className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
        )}

        <div className={inline ? "max-w-4xl mx-auto space-y-6 p-6" : "p-4 overflow-y-auto h-[calc(100%-64px)]"}>
          {/* Section Headers for Inline Mode */}
          {inline && <h2 className="text-2xl font-bold mb-6 text-white border-b border-gray-700 pb-4">Settings</h2>}
          {/* Data Management Section */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">Data Management</h4>
            <div className="space-y-3">
              <button
                className={`block w-full text-left px-4 py-3 border border-[var(--border-light)] rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-gray-50"} transition-colors`}
                onClick={() => { onClose(); onExportAll?.(); }}
              >
                <div className="font-medium">Export ALL notes (.json)</div>
                <div className="text-sm text-gray-500">Download all notes as JSON file</div>
              </button>

              <button
                className={`block w-full text-left px-4 py-3 border border-[var(--border-light)] rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-gray-50"} transition-colors`}
                onClick={() => { onClose(); onImportAll?.(); }}
              >
                <div className="font-medium">Import notes (.json)</div>
                <div className="text-sm text-gray-500">Import notes from JSON file</div>
              </button>

              <button
                className={`block w-full text-left px-4 py-3 border border-[var(--border-light)] rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-gray-50"} transition-colors`}
                onClick={() => { onClose(); onImportGKeep?.(); }}
              >
                <div className="font-medium">Import Google Keep notes (.json)</div>
                <div className="text-sm text-gray-500">Import notes from Google Keep JSON export</div>
              </button>

              <button
                className={`block w-full text-left px-4 py-3 border border-[var(--border-light)] rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-gray-50"} transition-colors`}
                onClick={() => { onClose(); onImportMd?.(); }}
              >
                <div className="font-medium">Import Markdown files (.md)</div>
                <div className="text-sm text-gray-500">Import notes from Markdown files</div>
              </button>

              <button
                className={`block w-full text-left px-4 py-3 border border-[var(--border-light)] rounded-lg ${dark ? "hover:bg-white/10" : "hover:bg-gray-50"} transition-colors`}
                onClick={() => { onClose(); onDownloadSecretKey?.(); }}
              >
                <div className="font-medium">Download secret key (.txt)</div>
                <div className="text-sm text-gray-500">Download your encryption key for backup</div>
              </button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">Appearance</h4>
            <div className="space-y-6">

              {/* Theme Presets */}
              <div>
                <div className="font-medium mb-3">Theme Presets</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {THEME_PRESETS.map((preset) => (
                     <button
                        key={preset.id}
                        onClick={() => {
                           // Apply all three theme properties at once
                           setBackgroundImage(preset.backgroundId);
                           setAccentColor(preset.accentId);
                           setBackgroundOverlay(preset.overlay);
                        }}
                        className="group relative h-24 rounded-lg overflow-hidden border border-[var(--border-light)] hover:border-accent transition-all hover:scale-[1.02] text-left"
                     >
                        {/* Preview Background */}
                        <div className="absolute inset-0 flex">
                           {preset.backgroundId ? (
                             <img 
                               src={BACKGROUNDS.find(b => b.id === preset.backgroundId)?.paths.thumb} 
                               className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity" 
                               alt={preset.name}
                             />
                           ) : (
                             <div className="w-full h-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
                           )}
                           {/* Overlay simulation */}
                           {preset.overlay && <div className="absolute inset-0 bg-black/20" />}
                        </div>
                        
                        {/* Content */}
                        <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                           <div className="text-sm font-bold text-white shadow-sm flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shadow-[0_0_5px_currentColor]" 
                                style={{ backgroundColor: ACCENT_COLORS.find(c => c.id === preset.accentId)?.hex, color: ACCENT_COLORS.find(c => c.id === preset.accentId)?.hex }} 
                              />
                              {preset.name} 
                           </div>
                        </div>
                        
                        {/* Active Indicator (if current state roughly matches preset) */}
                        {backgroundImage === preset.backgroundId && accentColor === preset.accentId && (
                           <div className="absolute top-2 right-2 bg-accent text-white rounded-full p-0.5 shadow-lg">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                           </div>
                        )}
                     </button>
                  ))}
                </div>
              </div>
              
              {/* Accent Color Picker */}
              <div>
                <div className="font-medium mb-3">Accent Color</div>
                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setAccentColor(color.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        accentColor === color.id 
                          ? 'ring-2 ring-offset-2 ring-offset-black/20 ring-white transform scale-110' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {accentColor === color.id && (
                        <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Transparency Picker */}
              <div>
                <div className="font-medium mb-3">Card Transparency</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">Default transparency for note cards. Individual cards can override this.</div>
                <div className="flex flex-wrap gap-2">
                  {TRANSPARENCY_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setCardTransparency(preset.id)}
                      className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                        cardTransparency === preset.id
                          ? 'border-accent bg-accent/20 text-accent font-medium'
                          : 'border-[var(--border-light)] hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                      title={`${Math.round(preset.opacity * 100)}% opacity`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">Workspace Background</div>
                    {backgroundImage && (
                       <label className="flex items-center gap-2 cursor-pointer">
                         <span className="text-xs text-gray-500">Overlay Theme</span>
                         <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${backgroundOverlay
                            ? 'bg-accent'
                            : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          onClick={() => setBackgroundOverlay(!backgroundOverlay)}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${backgroundOverlay ? 'translate-x-5' : 'translate-x-1'
                              }`}
                          />
                        </button>
                       </label>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                  {/* Default / None Option */}
                  <button
                    onClick={() => setBackgroundImage(null)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      !backgroundImage 
                        ? 'border-accent ring-2 ring-accent/50' 
                        : 'border-[var(--border-light)] hover:border-gray-400'
                    }`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center text-xs text-white font-medium">
                      Default
                    </div>
                    {!backgroundImage && (
                       <div className="absolute top-2 right-2 bg-accent rounded-full p-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                    )}
                  </button>
                  
                  {/* Wallpaper Options */}
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setBackgroundImage(bg.id)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                        backgroundImage === bg.id 
                          ? 'border-accent ring-2 ring-accent/50' 
                          : 'border-[var(--border-light)] hover:border-gray-400'
                      }`}
                      title={bg.name}
                    >
                      <img 
                        src={bg.paths.thumb} 
                        alt={bg.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[10px] text-white truncate text-center">{bg.name}</div>
                      </div>
                      
                      {backgroundImage === bg.id && (
                       <div className="absolute top-2 right-2 bg-accent rounded-full p-0.5 shadow-md">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                       </div>
                    )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* UI Preferences Section */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">UI Preferences</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Local AI Assistant</div>
                  <div className="text-sm text-gray-500">Ask questions about your notes (server-side model)</div>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localAiEnabled
                    ? 'bg-accent'
                    : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  onClick={() => {
                    if (!localAiEnabled) {
                      // Show confirmation dialog when enabling
                      showGenericConfirm({
                        title: "Enable AI Assistant?",
                        message: "This will download a ~700MB AI model (Llama-3.2-1B) to the server and may use significant CPU resources. The download will happen in the background. Continue?",
                        confirmText: "Enable AI",
                        cancelText: "Cancel",
                        danger: false,
                        onConfirm: async () => {
                          setLocalAiEnabled(true);
                          showToast("AI Assistant enabled. Model will download on first use.", "success");
                        }
                      });
                    } else {
                      // Disable without confirmation
                      setLocalAiEnabled(false);
                      showToast("AI Assistant disabled", "info");
                    }
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAiEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Always show sidebar on wide screens</div>
                  <div className="text-sm text-gray-500">Keep tags panel visible on screens wider than 700px</div>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${alwaysShowSidebarOnWide
                    ? 'bg-accent'
                    : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  onClick={() => setAlwaysShowSidebarOnWide(!alwaysShowSidebarOnWide)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alwaysShowSidebarOnWide ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** ---------- Admin Panel ---------- */
function AdminPanel({ open, onClose, dark, adminSettings, allUsers, newUserForm, setNewUserForm, updateAdminSettings, createUser, deleteUser, updateUser, currentUser, showGenericConfirm, showToast, inline }) {
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', password: '', is_admin: false });
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  console.log("AdminPanel render:", { open, adminSettings, allUsers: allUsers?.length });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setIsCreatingUser(true);
    try {
      await createUser(newUserForm);
      showToast("User created successfully!", "success");
    } catch (e) {
      // Error already handled in createUser function
    } finally {
      setIsCreatingUser(false);
    }
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      password: '',
      is_admin: user.is_admin
    });
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUserForm.name || !editUserForm.email) {
      showToast("Name and email are required", "error");
      return;
    }

    setIsUpdatingUser(true);
    try {
      // Only include password if it's not empty
      const updateData = {
        name: editUserForm.name,
        email: editUserForm.email,
        is_admin: editUserForm.is_admin
      };
      if (editUserForm.password) {
        updateData.password = editUserForm.password;
      }

      await updateUser(editingUser.id, updateData);
      showToast("User updated successfully!", "success");
      setEditUserModalOpen(false);
      setEditingUser(null);
    } catch (e) {
      showToast(e.message || "Failed to update user", "error");
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Prevent body scroll when admin panel is open
  React.useEffect(() => {
    if (inline) return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {open && !inline && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        />
      )}
      <div
        className={inline ? "w-full h-full" : `fixed top-0 right-0 z-50 h-full w-full sm:w-96 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
        style={inline ? {} : { backgroundColor: dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)", borderLeft: "1px solid var(--border-light)" }}
        aria-hidden={!open && !inline}
      >
        {!inline && (
        <div className="p-4 flex items-center justify-between border-b border-[var(--border-light)]">
          <h3 className="text-lg font-semibold">Admin Panel</h3>
          <button
            className="p-2 rounded hover:bg-black/5 dark:hover:bg-white/10"
            onClick={onClose}
            title="Close"
          >
            <CloseIcon />
          </button>
        </div>
        )}

        <div className={inline ? "p-6 max-w-5xl mx-auto space-y-6" : "p-4 overflow-y-auto h-[calc(100%-64px)]"}>
          {/* Settings Section */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Allow New Account Creation</span>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${adminSettings.allowNewAccounts
                    ? 'bg-accent'
                    : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  onClick={() => updateAdminSettings({ allowNewAccounts: !adminSettings.allowNewAccounts })}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminSettings.allowNewAccounts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Create User Section */}
          <div className="mb-8">
            <h4 className="text-md font-semibold mb-4">Create New User</h4>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
              />
              <input
                type="text"
                placeholder="Username"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={newUserForm.is_admin}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="is_admin" className="text-sm">Make admin</label>
              </div>
              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
              >
                {isCreatingUser ? "Creating..." : "Create User"}
              </button>
            </form>
          </div>

          {/* Users List Section */}
          <div>
            <h4 className="text-md font-semibold mb-4">All Users ({allUsers.length})</h4>
            <div className="space-y-3">
              {allUsers.map((user) => (
                <div key={user.id} className="p-3 border border-[var(--border-light)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.is_admin && (
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded">
                          Admin
                        </span>
                      )}
                      <button
                        onClick={() => openEditUserModal(user)}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      >
                        Edit
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => {
                            showGenericConfirm({
                              title: "Delete User",
                              message: `Are you sure you want to delete ${user.name}?`,
                              confirmText: "Delete",
                              danger: true,
                              onConfirm: () => deleteUser(user.id)
                            });
                          }}
                          className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Notes: {user.notes}</div>
                    <div>Storage: {formatBytes(user.storage_bytes ?? 0)}</div>
                    <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {editUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password (leave empty to keep current)</label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border-light)] rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-accent placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_admin"
                  checked={editUserForm.is_admin}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="edit_is_admin" className="text-sm">Make admin</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border-light)] rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50"
                >
                  {isUpdatingUser ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/** ---------- NotesUI (presentational) ---------- */
function NotesUI({
  currentUser, dark, toggleDark,
  search, setSearch,
  pinned, others,
  openModal,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
  togglePin,
  onExportAll, onImportAll, onImportGKeep, onImportMd, onDownloadSecretKey, importFileRef, gkeepFileRef, mdFileRef, signOut,
  filteredEmptyWithSearch, allEmpty,
  headerMenuOpen, setHeaderMenuOpen,
  headerMenuRef, headerBtnRef,
  // new for sidebar
  openSidebar,
  activeTagFilter,
  setTagFilter,
  tagsWithCounts,
  sidebarPermanent,
  // Admin Props
  adminSettings,
  allUsers,
  newUserForm,
  setNewUserForm,
  updateAdminSettings,
  createUser,
  deleteUser,
  updateUser,
  showGenericConfirm,
  showToast,
  sidebarWidth,
  // loading state
  notesLoading,
  // multi-select
  multiMode,
  selectedIds,
  onStartMulti,
  onExitMulti,
  onToggleSelect,
  onSelectAllPinned,
  onSelectAllOthers,
  onBulkDelete,
  onBulkPin,
  onBulkArchive,
  onBulkColor,
  onBulkDownloadZip,
  // view mode
  listView,
  onToggleViewMode,
  // SSE connection status
  sseConnected,
  isOnline,
  loadNotes,
  loadArchivedNotes,
  // Admin panel
  openAdminPanel,
  // Settings panel
  openSettingsPanel,
  // AI props
  localAiEnabled, setLocalAiEnabled, aiResponse, setAiResponse, isAiLoading, aiLoadingProgress, onAiSearch,
  // Settings props
  alwaysShowSidebarOnWide, setAlwaysShowSidebarOnWide,
  // Background props
  backgroundImage, setBackgroundImage, backgroundOverlay, setBackgroundOverlay,
  // Accent props
  accentColor, setAccentColor,
  // Transparency props
  cardTransparency, setCardTransparency
}) {
  const [activeSection, setActiveSection] = useState('overview');
  // Multi-select color popover (local UI state)
  const multiColorBtnRef = useRef(null);
  const [showMultiColorPop, setShowMultiColorPop] = useState(false);
  const tagLabel =
    activeTagFilter === ALL_IMAGES ? "All Images" :
      activeTagFilter === 'ARCHIVED' ? "Archived Notes" :
        activeTagFilter;

  // Close header menu when scrolling
  React.useEffect(() => {
    if (!headerMenuOpen) return;

    const handleScroll = () => {
      setHeaderMenuOpen(false);
    };

    const scrollContainer = document.querySelector('.min-h-screen');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [headerMenuOpen, setHeaderMenuOpen]);

  const dashboardTitle = activeSection === 'overview' 
    ? (tagLabel || 'All Notes') 
    : activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ');

  const currentBg = useMemo(() => BACKGROUNDS.find(b => b.id === backgroundImage), [backgroundImage]);

  return (
    <>
      {currentBg && (
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <img 
            src={currentBg.paths.desktop}
            srcSet={`${currentBg.paths.mobile} 800w, ${currentBg.paths.desktop} 1920w, ${currentBg.paths.xl} 3840w`}
            sizes="100vw"
            alt="Background"
            className="w-full h-full object-cover animate-in fade-in duration-700"
          />
          {/* Overlay for Shade Mode */}
          {backgroundOverlay && (
             <div 
               className="absolute inset-0 transition-opacity duration-700" 
               style={{ 
                 background: dark 
                   ? `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.2), transparent 40%), 
                      radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 40%),
                      linear-gradient(to bottom, #050505, #121212, #0a0a0a)`
                   : `radial-gradient(circle at 15% 50%, rgba(76, 29, 149, 0.15), transparent 25%), 
                      radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.1), transparent 25%),
                      linear-gradient(to bottom, #0f0c29, #302b63, #24243e)`,
                 opacity: 0.85
               }}
             />
          )}
          {/* Optional Contrast Overlay (active if shade off, or on top for extra dark) */}
          {dark && !backgroundOverlay && <div className="absolute inset-0 bg-black/40" />} 
        </div>
      )}
    <DashboardLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      user={currentUser}
      onSearch={setSearch}
      tags={tagsWithCounts}
      onTagSelect={setTagFilter}
      activeTag={activeTagFilter}
      isAdmin={currentUser?.is_admin}
      title={dashboardTitle}
      onSignOut={signOut}
    >
      <div className="pb-20">
      { activeSection === 'overview' && ( <>
      {/* Multi-select toolbar (floats above header when active) */}
      {multiMode && (
        <div className="p-3 sm:p-4 flex items-center justify-between sticky top-0 z-[25] glass-card mb-2" style={{ position: "sticky" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm" onClick={onBulkDownloadZip}>
              Download (.zip)
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm" onClick={onBulkDelete}>
              Delete
            </button>
            <button
              ref={multiColorBtnRef}
              type="button"
              onClick={() => setShowMultiColorPop((v) => !v)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
              title="Color"
            >
              🎨 Color
            </button>
            <Popover anchorRef={multiColorBtnRef} open={showMultiColorPop} onClose={() => setShowMultiColorPop(false)}>
              <div className={`fmt-pop ${dark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_ORDER.filter((name) => LIGHT_COLORS[name]).map((name) => (
                    <ColorDot
                      key={name}
                      name={name}
                      darkMode={dark}
                      selected={false}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBulkColor(name);
                        setShowMultiColorPop(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </Popover>
            {activeTagFilter !== 'ARCHIVED' && (
              <button className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm flex items-center gap-1" onClick={() => onBulkPin(true)}>
                <PinIcon />
                Pin
              </button>
            )}
            <button className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm flex items-center gap-1" onClick={onBulkArchive}>
              <ArchiveIcon />
              {activeTagFilter === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
            </button>
            <span className="text-xs opacity-70 ml-2">Selected: {selectedIds.length}</span>
          </div>
          <button
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Exit multi-select"
            onClick={onExitMulti}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="hidden">
        <div className="flex items-center gap-3">
          {/* Hamburger - only show when sidebar is not permanent */}
          {!sidebarPermanent && (
            <button
              onClick={openSidebar}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
              title="Open tags"
              aria-label="Open tags"
            >
              <Hamburger />
            </button>
          )}

          {/* App logo */}
          <img
            src="/favicon-32x32.png"
            srcSet="/pwa-192.png 2x, /pwa-512.png 3x"
            alt="Glass Keep logo"
            className="h-7 w-7 rounded-xl shadow-sm select-none pointer-events-none"
            draggable="false"
          />

          <h1 className="hidden sm:block text-2xl sm:text-3xl font-bold">Glass Keep</h1>
          {activeTagFilter && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent dark:text-accent border border-accent/20">
              {tagLabel === "All Images" || tagLabel === "Archived Notes" ? tagLabel : `Tag: ${tagLabel}`}
            </span>
          )}

          {/* Offline indicator */}
          {!isOnline && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange-600/10 text-orange-700 dark:text-orange-300 border border-orange-600/20">
              Offline
            </span>
          )}
        </div>

        <div className="flex-grow flex justify-center px-4 sm:px-8">
          <SearchBar
            value={search}
            onChange={setSearch}
            onAiSearch={onAiSearch}
            localAiEnabled={localAiEnabled}
            dark={dark}
            placeholder="Search..."
          />
        </div>

        <div className="relative flex items-center gap-3">
          <span className={`text-sm hidden sm:inline ${dark ? "text-gray-100" : "text-gray-900"}`}>
            {currentUser?.name ? `Hi, ${currentUser.name}` : currentUser?.email}
          </span>

          {/* Header 3-dot menu */}
          <button
            ref={headerBtnRef}
            onClick={() => setHeaderMenuOpen((v) => !v)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-gray-800"
            title="Menu"
            aria-haspopup="menu"
            aria-expanded={headerMenuOpen}
          >
            <Kebab />
          </button>

          {headerMenuOpen && (
            <>
              {/* Backdrop to close menu when clicking outside */}
              <div
                className="fixed inset-0 z-[1099]"
                onClick={() => setHeaderMenuOpen(false)}
              />
              <div
                ref={headerMenuRef}
                className={`absolute top-12 right-0 min-w-[220px] z-[1100] border border-[var(--border-light)] rounded-lg shadow-lg overflow-hidden ${dark ? "text-gray-100" : "bg-white text-gray-800"}`}
                style={{ backgroundColor: dark ? "#222222" : undefined }}
                onClick={(e) => e.stopPropagation()}
              >

                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                  onClick={() => { setHeaderMenuOpen(false); openSettingsPanel?.(); }}
                >
                  <SettingsIcon />
                  Settings
                </button>
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                  onClick={() => { setHeaderMenuOpen(false); onToggleViewMode?.(); }}
                >
                  {listView ? <GridIcon /> : <ListIcon />}
                  {listView ? "Grid View" : "List View"}
                </button>
                {/* Theme toggle text item */}
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                  onClick={() => { setHeaderMenuOpen(false); toggleDark?.(); }}
                >
                  {dark ? <SunIcon /> : <MoonIcon />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                  onClick={() => { setHeaderMenuOpen(false); onStartMulti?.(); }}
                >
                  <CheckSquareIcon />
                  Multi select
                </button>
                {currentUser?.is_admin && (
                  <button
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}
                    onClick={() => { setHeaderMenuOpen(false); openAdminPanel?.(); }}
                  >
                    <ShieldIcon />
                    Admin Panel
                  </button>
                )}
                <button
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${dark ? "text-red-400 hover:bg-white/10" : "text-red-600 hover:bg-gray-100"}`}
                  onClick={() => { setHeaderMenuOpen(false); signOut?.(); }}
                >
                  <LogOutIcon />
                  Sign out
                </button>
              </div>
            </>
          )}

          {/* Hidden import input */}
          <input
            ref={importFileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length) {
                await onImportAll?.(e.target.files);
                e.target.value = "";
              }
            }}
          />
          {/* Hidden Google Keep import input (multiple) */}
          <input
            ref={gkeepFileRef}
            type="file"
            accept="application/json"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length) {
                await onImportGKeep?.(e.target.files);
                e.target.value = "";
              }
            }}
          />
          {/* Hidden Markdown import input (multiple) */}
          <input
            ref={mdFileRef}
            type="file"
            accept=".md,text/markdown"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length) {
                await onImportMd?.(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>
      </header>

      {/* AI Response Box */}
      {localAiEnabled && (aiResponse || isAiLoading) && (
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 mb-6">
          <div className="max-w-2xl mx-auto glass-card rounded-xl shadow-lg p-5 border border-accent/30 relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/30">
            {isAiLoading && (
              <div className="absolute top-0 left-0 h-1 bg-accent transition-all duration-300"
                style={{ width: aiLoadingProgress ? `${aiLoadingProgress}%` : '5%' }}
              />
            )}
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-accent dark:text-indigo-400" />
              <h3 className="font-semibold text-accent dark:text-accent">AI Assistant</h3>
              {aiResponse && !isAiLoading && (
                <button
                  onClick={() => { setAiResponse(null); setSearch(''); }}
                  className="ml-auto p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                  title="Clear response"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
              {isAiLoading ? (
                <p className="animate-pulse text-gray-500 italic flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
                  AI Assistant is thinking...
                </p>
              ) : (
                <div
                  className="text-gray-800 dark:text-gray-200 note-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(aiResponse || "") }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <Composer />
        </div>
      </div>
        </div>
      </div >

      {/* Notes lists */}
      < main className="px-4 sm:px-6 md:px-8 lg:px-12 pb-12" >
        {
          pinned.length > 0 && (
            <section className="mb-10">
              {listView ? (
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1">
                    Pinned
                  </h2>
                </div>
              ) : (
                <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1">
                  Pinned
                </h2>
              )}
              <div className={listView ? "max-w-2xl mx-auto space-y-6" : "masonry-grid"}>
                {pinned.map((n) => (
                  <NoteCard
                    key={n.id}
                    n={n}
                    dark={dark}
                    openModal={openModal}
                    togglePin={togglePin}
                    multiMode={multiMode}
                    selected={selectedIds.includes(String(n.id))}
                    onToggleSelect={onToggleSelect}
                    disablePin={('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || activeTagFilter === 'ARCHIVED'}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    isOnline={isOnline}
                    onUpdateChecklistItem={onUpdateChecklistItem}
                    currentUser={currentUser}
                    globalTransparency={cardTransparency}
                    bgFor={bgFor}
                  />
                ))}
              </div>
            </section>
          )
        }

        {
          others.length > 0 && (
            <section>
              {pinned.length > 0 && (
                listView ? (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1">
                      Others
                    </h2>
                  </div>
                ) : (
                  <h2 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3 ml-1">
                    Others
                  </h2>
                )
              )}
              <div className={listView ? "max-w-2xl mx-auto space-y-6" : "masonry-grid"}>
                {others.map((n) => (
                  <NoteCard
                    key={n.id}
                    n={n}
                    dark={dark}
                    openModal={openModal}
                    togglePin={togglePin}
                    multiMode={multiMode}
                    selected={selectedIds.includes(String(n.id))}
                    onToggleSelect={onToggleSelect}
                    disablePin={('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || activeTagFilter === 'ARCHIVED'}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onDragEnd={onDragEnd}
                    isOnline={isOnline}
                    onUpdateChecklistItem={onUpdateChecklistItem}
                    currentUser={currentUser}
                    globalTransparency={cardTransparency}
                    bgFor={bgFor}
                  />
                ))}
              </div>
            </section>
          )
        }

        {
          notesLoading && (pinned.length + others.length === 0) && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
              Loading Notes…
            </p>
          )
        }
        {
          !notesLoading && filteredEmptyWithSearch && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
              No matching notes found.
            </p>
          )
        }
        {
          !notesLoading && allEmpty && (
            <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
              No notes yet. Add one to get started!
            </p>
          )
        }
      </main >
      </> )}

      {activeSection === 'alerts' && (
        <div className="p-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
               <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No Active Alerts</h2>
            <p className="text-gray-400 max-w-md">Your system is running smoothly. Any critical notifications will appear here.</p>
        </div>
      )}

      {activeSection === 'health' && (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                 <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                 System Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border-t-4 border-accent">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">CPU Load</h3>
                    <div className="text-3xl font-bold text-white">12%</div>
                    <div className="mt-4 w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-accent w-[12%] shadow-[0_0_10px_currentColor]" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-t-4 border-purple-500">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Memory</h3>
                    <div className="text-3xl font-bold text-white">42%</div>
                    <div className="mt-4 w-full h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[42%] shadow-[0_0_10px_currentColor]" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl border-t-4 border-emerald-500">
                    <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Disk I/O</h3>
                    <div className="text-3xl font-bold text-white">1.2 MB/s</div>
                    <div className="mt-4 text-xs text-emerald-400 font-mono">READ/WRITE OPTIMAL</div>
                </div>
            </div>
        </div>
      )}

      {activeSection === 'admin' && (
         <AdminPanel 
            inline={true} 
            adminSettings={adminSettings}
            allUsers={allUsers}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            updateAdminSettings={updateAdminSettings}
            createUser={createUser}
            deleteUser={deleteUser}
            updateUser={updateUser}
            currentUser={currentUser}
            showGenericConfirm={showGenericConfirm}
            showToast={showToast}
         />
      )}

      {activeSection === 'settings' && (
        <SettingsPanel 
          inline={true}
          dark={dark} 
          onExportAll={onExportAll} 
          onImportAll={onImportAll} 
          onImportGKeep={onImportGKeep} 
          onImportMd={onImportMd} 
          onDownloadSecretKey={onDownloadSecretKey}
          alwaysShowSidebarOnWide={alwaysShowSidebarOnWide} 
          setAlwaysShowSidebarOnWide={setAlwaysShowSidebarOnWide} 
          localAiEnabled={localAiEnabled} 
          setLocalAiEnabled={setLocalAiEnabled}
          backgroundImage={backgroundImage}
          setBackgroundImage={setBackgroundImage}
          backgroundOverlay={backgroundOverlay}
          setBackgroundOverlay={setBackgroundOverlay}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          cardTransparency={cardTransparency}
          setCardTransparency={setCardTransparency}
          showGenericConfirm={showGenericConfirm} 
          showToast={showToast}
          // Dummy for now until wired up completely
          open={true}
          onClose={() => setActiveSection('overview')}
        />
      )}

      </div>
    </DashboardLayout>
    </>
  );
}

/** ---------- AdminView ---------- */
function AdminView({ dark }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const sess = getAuth();
  const token = sess?.token;

  const formatBytes = (n = 0) => {
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const e = Math.min(Math.floor(Math.log10(n) / 3), units.length - 1);
    const v = n / Math.pow(1024, e);
    return `${v.toFixed(v >= 100 ? 0 : v >= 10 ? 1 : 2)} ${units[e]}`;
  };

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message || "Failed to load admin data");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeUser(id) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  useEffect(() => { load(); }, []); // load once

  return (
    <div className="min-h-screen px-4 sm:px-6 md:px-8 lg:px-12 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Admin</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          Manage registered users. You can remove users (this also deletes their notes).
        </p>

        <div className="glass-card rounded-xl p-4 shadow-lg overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Users</h2>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 text-sm"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--border-light)]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email / Username</th>
                <th className="py-2 pr-3">Notes</th>
                <th className="py-2 pr-3">Storage</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border-light)] last:border-0">
                  <td className="py-2 pr-3">{u.name}</td>
                  <td className="py-2 pr-3">{u.email}</td>
                  <td className="py-2 pr-3">{u.notes ?? 0}</td>
                  <td className="py-2 pr-3">{formatBytes(u.storage_bytes ?? 0)}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_admin
                        ? "bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/30"
                        : "bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20"
                        }`}
                    >
                      {u.is_admin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3">
                    <button
                      className="px-2.5 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                      onClick={() => {
                        showGenericConfirm({
                          title: "Delete User",
                          message: "Delete this user and ALL their notes? This cannot be undone.",
                          confirmText: "Delete",
                          danger: true,
                          onConfirm: () => removeUser(u.id)
                        });
                      }}
                      title="Delete user"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading…</div>
          )}
        </div>
      </div>
    </div>
  );
}

/** ---------- App ---------- */
export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/login");

  // Use custom hooks for auth, notes, and settings
  const { session, token, currentUser, isAdmin, updateSession, logout } = useAuth();
  const { 
    notes, notesLoading, search, setSearch, tagFilter, setTagFilter, 
    loadNotes, loadArchivedNotes, toggleArchiveNote, deleteNote, reorderNotes,
    togglePin
  } = useNotes();
  const { open: modalOpen, openNote } = useModal();
  const { sidebarOpen, setSidebarOpen } = useUI();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const { 
    dark, 
    backgroundImage, 
    backgroundOverlay, 
    accentColor, 
    cardTransparency,
    alwaysShowSidebarOnWide,
    sidebarWidth,
    localAiEnabled,
    toggleDark,
    setSettings
  } = useSettings();
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiLoadingProgress, setAiLoadingProgress] = useState(null);

  // Modal state - moved to ModalContext
  const [genericConfirmOpen, setGenericConfirmOpen] = useState(false);
  const [genericConfirmConfig, setGenericConfirmConfig] = useState({});

  // Toast notification system
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  };

  // Generic confirmation dialog helper
  const showGenericConfirm = (config) => {
    setGenericConfirmConfig(config);
    setGenericConfirmOpen(true);
  };

  // Modal related refs/state - moved to ModalContext

  // Image Viewer state (fullscreen) - moved to ModalContext

  // Drag
  const dragId = useRef(null);
  const dragGroup = useRef(null);

  // Header menu refs + state
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef(null);
  const headerBtnRef = useRef(null);
  const importFileRef = useRef(null);
  const gkeepFileRef = useRef(null);
  const mdFileRef = useRef(null);

  // -------- Multi-select state --------
  const [multiMode, setMultiMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]); // array of string ids
  const isSelected = (id) => selectedIds.includes(String(id));
  const onStartMulti = () => { setMultiMode(true); setSelectedIds([]); };
  const onExitMulti = () => { setMultiMode(false); setSelectedIds([]); };
  const onToggleSelect = (id, checked) => {
    const sid = String(id);
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, sid])) : prev.filter((x) => x !== sid)));
  };
  const onSelectAllPinned = () => {
    const ids = notes.filter((n) => n.pinned).map((n) => String(n.id));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };
  const onSelectAllOthers = () => {
    const ids = notes.filter((n) => !n.pinned).map((n) => String(n.id));
    setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  // -------- View mode: Grid vs List --------
  const [listView, setListView] = useState(() => {
    try { return localStorage.getItem("viewMode") === "list"; } catch (e) { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("viewMode", listView ? "list" : "grid"); } catch (e) { }
  }, [listView]);
  const onToggleViewMode = () => setListView((v) => !v);

  // Save sidebar settings
  useEffect(() => {
    try { localStorage.setItem("sidebarAlwaysVisible", String(alwaysShowSidebarOnWide)); } catch (e) { }
  }, [alwaysShowSidebarOnWide]);

  useEffect(() => {
    try { localStorage.setItem("sidebarWidth", String(sidebarWidth)); } catch (e) { }
  }, [sidebarWidth]);

  useEffect(() => {
    try { localStorage.setItem("localAiEnabled", String(localAiEnabled)); } catch (e) { }
    if (!localAiEnabled) setAiResponse(null);
  }, [localAiEnabled]);

  // Window resize listener for responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const onBulkDelete = async () => {
    if (!selectedIds.length) return;
    showGenericConfirm({
      title: "Delete Notes",
      message: `Delete ${selectedIds.length} selected note(s)? This cannot be undone.`,
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          // Fire deletes sequentially to keep API simple
          for (const id of selectedIds) {
            await api(`/notes/${id}`, { method: "DELETE", token });
          }
          setNotes((prev) => prev.filter((n) => !selectedIds.includes(String(n.id))));
          onExitMulti();
        } catch (e) {
          alert(e.message || "Bulk delete failed");
        }
      }
    });
  };

  const onBulkPin = async (pinnedVal) => {
    if (!selectedIds.length) return;
    try {
      // Optimistic update
      setNotes((prev) => prev.map((n) => (selectedIds.includes(String(n.id)) ? { ...n, pinned: !!pinnedVal } : n)));
      // Persist in background (best-effort)
      for (const id of selectedIds) {
        await api(`/notes/${id}`, { method: "PATCH", token, body: { pinned: !!pinnedVal } });
      }
      // Invalidate caches
      invalidateNotesCache();
      invalidateArchivedNotesCache();
      // Reload fresh data since we invalidated caches
      if (tagFilter === 'ARCHIVED') {
        loadArchivedNotes().catch(() => { });
      } else {
        loadNotes().catch(() => { });
      }
    } catch (e) {
      console.error("Bulk pin failed", e);
      // Reload appropriate notes based on current view
      if (tagFilter === 'ARCHIVED') {
        loadArchivedNotes().catch(() => { });
      } else {
        loadNotes().catch(() => { });
      }
    }
  };

  const onBulkArchive = async () => {
    if (!selectedIds.length) return;

    // Determine if we're archiving or unarchiving based on current view
    const isArchiving = tagFilter !== 'ARCHIVED';
    const archivedValue = isArchiving;

    try {
      // Optimistic update - remove from current view
      setNotes((prev) => prev.filter((n) => !selectedIds.includes(String(n.id))));
      // Persist in background (best-effort)
      for (const id of selectedIds) {
        await api(`/notes/${id}/archive`, { method: "POST", token, body: { archived: archivedValue } });
      }
      // Invalidate caches
      invalidateNotesCache();
      invalidateArchivedNotesCache();

      // If we just unarchived notes from archived view, switch to regular notes view
      if (!isArchiving && tagFilter === 'ARCHIVED') {
        setTagFilter(null);
        await loadNotes();
      }

      // Exit multi-select mode
      onExitMulti();
    } catch (e) {
      console.error(`Bulk ${isArchiving ? 'archive' : 'unarchive'} failed`, e);
      // Reload notes on failure
      if (tagFilter === 'ARCHIVED') {
        loadArchivedNotes().catch(() => { });
      } else {
        loadNotes().catch(() => { });
      }
    }
  };

  const onBulkColor = async (colorName) => {
    if (!selectedIds.length) return;
    try {
      setNotes((prev) => prev.map((n) => (selectedIds.includes(String(n.id)) ? { ...n, color: colorName } : n)));
      for (const id of selectedIds) {
        await api(`/notes/${id}`, { method: "PATCH", token, body: { color: colorName } });
      }
    } catch (e) {
      console.error("Bulk color failed", e);
      loadNotes().catch(() => { });
    }
  };

  const onBulkDownloadZip = async () => {
    try {
      const ids = new Set(selectedIds);
      const chosen = notes.filter((n) => ids.has(String(n.id)));
      if (!chosen.length) return;
      const JSZip = await ensureJSZip();
      const zip = new JSZip();
      chosen.forEach((n, idx) => {
        const md = mdForDownload(n);
        const base = sanitizeFilename(n.title || `note-${String(n.id).slice(-6)}`);
        zip.file(`${base || `note-${idx + 1}`}.md`, md);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      triggerBlobDownload(`glass-keep-selected-${ts}.zip`, blob);
    } catch (e) {
      alert(e.message || "ZIP download failed");
    }
  };

  // Hook: Real-time collaboration via SSE
  const { sseConnected, isOnline } = useCollaboration({
    token,
    tagFilter,
    onNotesUpdated: () => {
      if (tagFilter === 'ARCHIVED') {
        loadArchivedNotes().catch(() => {});
      } else {
        loadNotes().catch(() => {});
      }
    }
  });

  // Hook: Admin panel operations
  const { adminSettings, allUsers, newUserForm, setNewUserForm, updateAdminSettings, createUser, deleteUser, updateUser, loadAdminPanel } = useAdmin(token);

  // Admin panel state
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // Settings panel state
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  useEffect(() => {
    // Only close header kebab on outside click (modal kebab is handled by Popover)
    function onDocClick(e) {
      if (headerMenuOpen) {
        const m = headerMenuRef.current;
        const b = headerBtnRef.current;
        if (m && m.contains(e.target)) return;
        if (b && b.contains(e.target)) return;
        setHeaderMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [headerMenuOpen]);

  // CSS inject
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = globalCSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Router
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "#/login");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const navigate = (to) => {
    if (window.location.hash !== to) window.location.hash = to;
    setRoute(to);
  };

  // Theme init/toggle
  useEffect(() => {
    const savedDark =
      localStorage.getItem("glass-keep-dark-mode") === "true" ||
      (!("glass-keep-dark-mode" in localStorage) &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", savedDark);
  }, [dark, toggleDark]);

  // Close sidebar with Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  // Cache keys for localStorage
  const NOTES_CACHE_KEY = `glass-keep-notes-${currentUser?.id || 'anonymous'}`;
  const ARCHIVED_NOTES_CACHE_KEY = `glass-keep-archived-${currentUser?.id || 'anonymous'}`;
  const CACHE_TIMESTAMP_KEY = `glass-keep-cache-timestamp-${currentUser?.id || 'anonymous'}`;

  // Cache invalidation functions
  const invalidateNotesCache = () => {
    try {
      localStorage.removeItem(NOTES_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Error invalidating notes cache:", error);
    }
  };

  const invalidateArchivedNotesCache = () => {
    try {
      localStorage.removeItem(ARCHIVED_NOTES_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Error invalidating archived notes cache:", error);
    }
  };

  const uniqueById = (arr) => {
    const m = new Map();
    for (const n of Array.isArray(arr) ? arr : []) {
      if (!n) continue;
      m.set(String(n.id), n);
    }
    return Array.from(m.values());
  };

  const handleAiSearch = async (question) => {
    if (!question || question.trim().length < 3) return;
    setIsAiLoading(true);
    setAiResponse(null);
    setAiLoadingProgress(0);

    try {
      const answer = await askAI(question, notes, (progress) => {
        if (progress.status === 'progress') {
          setAiLoadingProgress(progress.progress);
        } else if (progress.status === 'ready') {
          setAiLoadingProgress(100);
        }
      });
      setAiResponse(answer);
    } catch (err) {
      console.error("AI Error:", err);
      setAiResponse("Sorry, I encountered an error while processing your request.");
    } finally {
      setIsAiLoading(false);
      setAiLoadingProgress(null);
    }
  };

  useEffect(() => {
    if (!token) return;

    console.log("Tag filter changed to:", tagFilter, "from previous value");

    // Load appropriate notes based on tag filter
    if (tagFilter === 'ARCHIVED') {
      console.log("Loading archived notes...");
      loadArchivedNotes().catch((error) => {
        console.error("Failed to load archived notes:", error);
      });
    } else {
      console.log("Loading regular notes...");
      loadNotes().catch((error) => {
        console.error("Failed to load regular notes:", error);
      });
    }
  }, [token, tagFilter]);

  // Check registration setting on app load
  useEffect(() => {
    checkRegistrationSetting();
  }, []);

  // Handle token expiration globally - must be after signOut is defined
  // This will be added after signOut is defined below

  // SSE connection and real-time sync is now handled by useCollaboration hook
  // which manages EventSource, reconnection, polling, visibility changes, and online/offline events

  // Live-sync checklist items in open modal when remote updates arrive
  useEffect(() => {
    if (!open || !activeId) return;
    const n = notes.find((x) => String(x.id) === String(activeId));
    if (!n) return;
    if ((mType || n.type) !== "checklist") return;
    const serverItems = Array.isArray(n.items) ? n.items : [];
    const prevJson = JSON.stringify(prevItemsRef.current || []);
    const serverJson = JSON.stringify(serverItems);
    if (serverJson !== prevJson) {
      setMItems(serverItems);
      prevItemsRef.current = serverItems;
    }
  }, [notes, open, activeId, mType]);

  // Auto-save drawing changes
  useEffect(() => {
    if (!open || !activeId || mType !== "draw") return;
    if (skipNextDrawingAutosave.current) {
      skipNextDrawingAutosave.current = false;
      return;
    }

    const prevJson = JSON.stringify(prevDrawingRef.current || { paths: [], dimensions: null });
    const currentJson = JSON.stringify(mDrawingData || { paths: [], dimensions: null });
    if (prevJson === currentJson) return;

    // Debounce auto-save by 500ms
    const timeoutId = setTimeout(async () => {
      try {
        await api(`/notes/${activeId}`, {
          method: "PATCH",
          token,
          body: { content: JSON.stringify(mDrawingData), type: "draw" }
        });
        prevDrawingRef.current = mDrawingData;
        invalidateNotesCache();
      } catch (e) {
        console.error("Failed to auto-save drawing:", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [mDrawingData, open, activeId, mType, token]);

  // Live-sync drawing data in open modal when remote updates arrive
  useEffect(() => {
    if (!open || !activeId) return;
    const n = notes.find((x) => String(x.id) === String(activeId));
    if (!n || n.type !== "draw") return;

    try {
      const serverDrawingData = JSON.parse(n.content || "[]");
      // Handle backward compatibility: if it's an array, convert to new format
      const normalizedData = Array.isArray(serverDrawingData)
        ? { paths: serverDrawingData, dimensions: null }
        : serverDrawingData;
      const prevJson = JSON.stringify(prevDrawingRef.current || []);
      const serverJson = JSON.stringify(normalizedData);
      if (serverJson !== prevJson) {
        setMDrawingData(normalizedData);
        prevDrawingRef.current = normalizedData;
      }
    } catch (e) {
      // Invalid JSON, ignore
    }
  }, [notes, open, activeId]);

  // No infinite scroll

  // Lock body scroll on modal & image viewer
  useEffect(() => {
    if (!open && !imgViewOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, imgViewOpen]);

  // Close image viewer if modal closes
  useEffect(() => {
    if (!open) setImgViewOpen(false);
  }, [open]);

  // Keyboard nav for image viewer
  useEffect(() => {
    if (!imgViewOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setImgViewOpen(false);
      if (e.key.toLowerCase() === "d") {
        const im = mImages[imgViewIndex];
        if (im) {
          const fname = normalizeImageFilename(im.name, im.src, imgViewIndex + 1);
          downloadDataUrl(fname, im.src);
        }
      }
      if (e.key === "ArrowRight" && mImages.length > 1) {
        setImgViewIndex((i) => (i + 1) % mImages.length);
      }
      if (e.key === "ArrowLeft" && mImages.length > 1) {
        setImgViewIndex((i) => (i - 1 + mImages.length) % mImages.length);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [imgViewOpen, mImages, imgViewIndex]);

  // Auto-resize modal textarea with debouncing
  const resizeModalTextarea = useMemo(() => {
    let timeoutId = null;
    return () => {
      const el = mBodyRef.current;
      if (!el) return;

      // Clear previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce the resize to prevent excessive updates
      timeoutId = setTimeout(() => {
        const modalScrollEl = modalScrollRef.current;
        const scrollTop = modalScrollEl?.scrollTop || 0;

        // Set a minimum height to prevent layout shifts
        const MIN = 160;
        el.style.height = MIN + "px";
        el.style.height = Math.max(el.scrollHeight, MIN) + "px";

        // Prevent browser auto-scroll by restoring scroll position after DOM update
        requestAnimationFrame(() => {
          if (modalScrollEl) {
            modalScrollEl.scrollTop = scrollTop;
          }
        });
      }, 10); // Small delay to batch rapid changes
    };
  }, []);
  useEffect(() => {
    if (!open || mType !== "text") return;
    if (!viewMode) resizeModalTextarea();
  }, [open, viewMode, mBody, mType]);

  // Ensure modal formatting menu hides when switching to view mode or non-text
  useEffect(() => {
    if (viewMode || mType !== "text") setShowModalFmt(false);
  }, [viewMode, mType]);

  // Detect if modal body is scrollable to decide Edited stamp placement
  useEffect(() => {
    if (!open) return;
    const el = modalScrollRef.current;
    if (!el) return;

    const check = () => {
      // +1 fudge factor to avoid off-by-one on some browsers
      setModalScrollable(el.scrollHeight > el.clientHeight + 1);
    };
    check();

    // React to container size changes and window resizes
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(check);
      ro.observe(el);
    }
    window.addEventListener("resize", check);

    // Also recheck shortly after (images rendering, fonts, etc.)
    const t1 = setTimeout(check, 50);
    const t2 = setTimeout(check, 200);

    return () => {
      window.removeEventListener("resize", check);
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
  }, [open, mBody, mTitle, mItems.length, mImages.length, viewMode, mType]);

  /** -------- Auth actions -------- */
  const signOut = () => {
    setAuth(null);
    setSession(null);
    setNotes([]);
    // Clear all cached data for this user
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('glass-keep-')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing cache on sign out:", error);
    }
    navigate("#/login");
  };
  const signIn = async (email, password) => {
    const res = await api("/login", { method: "POST", body: { email, password } });
    setSession(res);
    setAuth(res);
    navigate("#/notes");
    return { ok: true };
  };
  const signInWithSecret = async (key) => {
    const res = await api("/login/secret", { method: "POST", body: { key } });
    setSession(res);
    setAuth(res);
    navigate("#/notes");
    return { ok: true };
  };
  const register = async (name, email, password) => {
    const res = await api("/register", { method: "POST", body: { name, email, password } });
    setSession(res);
    setAuth(res);
    navigate("#/notes");
    return { ok: true };
  };

  // Handle token expiration globally
  useEffect(() => {
    const handleAuthExpired = () => {
      console.log("Auth expired, signing out...");
      // Clear auth and redirect to login
      setAuth(null);
      setSession(null);
      setNotes([]);
      // Clear all cached data
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('glass-keep-')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.error("Error clearing cache on auth expiration:", error);
      }
      navigate("#/login");
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [navigate]);

  /** -------- Download single note .md -------- */
  const handleDownloadNote = (note) => {
    const md = mdForDownload(note);
    const fname = sanitizeFilename(note.title || `note-${note.id}`) + ".md";
    downloadText(fname, md);
  };

  /** -------- Archive/Unarchive note -------- */
  const handleArchiveNote = async (noteId, archived) => {
    try {
      await api(`/notes/${noteId}/archive`, { method: "POST", token, body: { archived } });

      // Invalidate both caches since archiving affects both regular and archived notes
      invalidateNotesCache();
      invalidateArchivedNotesCache();

      // Reload appropriate notes based on current view
      if (tagFilter === 'ARCHIVED') {
        if (!archived) {
          // If unarchiving from archived view, switch back to regular view
          setTagFilter(null);
          await loadNotes();
        } else {
          await loadArchivedNotes();
        }
      } else {
        await loadNotes();
      }

      if (archived) {
        closeModal();
      }
    } catch (e) {
      alert(e.message || "Failed to archive note");
    }
  };

  /** -------- Admin Panel Functions (moved to useAdmin hook) -------- */
  // All admin operations are now handled by the useAdmin hook:
  // - loadAdminSettings, updateAdminSettings, loadAllUsers, 
  // - createUser, deleteUser, updateUser, loadAdminPanel

  const openAdminPanel = async () => {
    console.log("Opening admin panel...");
    setAdminPanelOpen(true);
    try {
      await loadAdminPanel();
      console.log("Admin panel data loaded successfully");
    } catch (error) {
      console.error("Error loading admin panel data:", error);
    }
  };

  const openSettingsPanel = () => {
    setSettingsPanelOpen(true);
  };

  // Check if registration is allowed
  const checkRegistrationSetting = async () => {
    try {
      const response = await api("/admin/allow-registration");
      setAllowRegistration(response.allowNewAccounts);
    } catch (e) {
      console.error("Failed to check registration setting:", e);
      setAllowRegistration(false); // Default to false if check fails
    }
  };

  /** -------- Export / Import All -------- */
  const triggerJSONDownload = (filename, jsonText) => {
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a);
    a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const exportAll = async () => {
    try {
      const payload = await api("/notes/export", { token });
      const json = JSON.stringify(payload, null, 2);
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const fname = sanitizeFilename(`glass-keep-notes-${currentUser?.email || "user"}-${ts}`) + ".json";
      triggerJSONDownload(fname, json);
    } catch (e) {
      alert(e.message || "Export failed");
    }
  };

  const importAll = async (fileList) => {
    try {
      if (!fileList || !fileList.length) return;
      const file = fileList[0];
      const text = await file.text();
      const parsed = JSON.parse(text);
      const notesArr = Array.isArray(parsed?.notes) ? parsed.notes : (Array.isArray(parsed) ? parsed : []);
      if (!notesArr.length) { alert("No notes found in file."); return; }
      await api("/notes/import", { method: "POST", token, body: { notes: notesArr } });
      await loadNotes();
      alert(`Imported ${notesArr.length} note(s) successfully.`);
    } catch (e) {
      alert(e.message || "Import failed");
    }
  };

  /** -------- Import Google Keep single-note JSON files (multiple) -------- */
  const importGKeep = async (fileList) => {
    try {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      const texts = await Promise.all(files.map((f) => f.text().catch(() => null)));
      const notesArr = [];
      for (const t of texts) {
        if (!t) continue;
        try {
          const obj = JSON.parse(t);
          if (!obj || typeof obj !== "object") continue;
          const title = String(obj.title || "");
          const hasChecklist = Array.isArray(obj.listContent) && obj.listContent.length > 0;
          const items = hasChecklist
            ? obj.listContent.map((it) => ({ id: uid(), text: String(it?.text || ""), done: !!it?.isChecked }))
            : [];
          const content = hasChecklist ? "" : String(obj.textContent || "");
          const usec = Number(obj.userEditedTimestampUsec || obj.createdTimestampUsec || 0);
          const ms = Number.isFinite(usec) && usec > 0 ? Math.floor(usec / 1000) : Date.now();
          const timestamp = new Date(ms).toISOString();
          // Extract labels to tags
          const tags = Array.isArray(obj.labels)
            ? obj.labels.map((l) => (typeof l?.name === 'string' ? l.name.trim() : '')).filter(Boolean)
            : [];
          notesArr.push({
            id: uid(),
            type: hasChecklist ? "checklist" : "text",
            title,
            content,
            items,
            tags,
            images: [],
            color: "default",
            pinned: !!obj.isPinned,
            position: ms,
            timestamp,
          });
        } catch (e) { }
      }
      if (!notesArr.length) { alert("No valid Google Keep notes found."); return; }
      await api("/notes/import", { method: "POST", token, body: { notes: notesArr } });
      await loadNotes();
      alert(`Imported ${notesArr.length} Google Keep note(s).`);
    } catch (e) {
      alert(e.message || "Google Keep import failed");
    }
  };

  /** -------- Import Markdown files (multiple) -------- */
  const importMd = async (fileList) => {
    try {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      const notesArr = [];

      for (const file of files) {
        try {
          const text = await file.text();
          const lines = text.split('\n');

          // Extract title from first line if it starts with #
          let title = "";
          let contentStartIndex = 0;

          if (lines[0] && lines[0].trim().startsWith('#')) {
            // Remove # symbols and trim
            title = lines[0].replace(/^#+\s*/, '').trim();
            contentStartIndex = 1;
          } else {
            // Use filename as title (without .md extension)
            title = file.name.replace(/\.md$/i, '');
          }

          // Join remaining lines as content
          const content = lines.slice(contentStartIndex).join('\n').trim();

          if (title || content) {
            notesArr.push({
              id: uid(),
              type: "text",
              title,
              content,
              items: [],
              tags: [],
              images: [],
              color: "default",
              pinned: false,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error(`Failed to process file ${file.name}:`, e);
        }
      }

      if (!notesArr.length) {
        alert("No valid markdown files found.");
        return;
      }

      await api("/notes/import", { method: "POST", token, body: { notes: notesArr } });
      await loadNotes();
      alert(`Imported ${notesArr.length} markdown file(s) successfully.`);
    } catch (e) {
      alert(e.message || "Markdown import failed");
    }
  };

  /** -------- Collaboration actions -------- */
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [collaborationDialogNoteId, setCollaborationDialogNoteId] = useState(null);
  const [noteCollaborators, setNoteCollaborators] = useState([]);
  const [isNoteOwner, setIsNoteOwner] = useState(false);

  const loadNoteCollaborators = useCallback(async (noteId) => {
    try {
      const collaborators = await api(`/notes/${noteId}/collaborators`, { token });
      setNoteCollaborators(collaborators || []);

      // Check if current user is the owner
      // Try to get note from current notes list
      const note = notes.find(n => String(n.id) === String(noteId));
      // If note has user_id, use it; otherwise check if user is in collaborators list
      if (note?.user_id) {
        setIsNoteOwner(note.user_id === currentUser?.id);
      } else {
        // If note doesn't have user_id, check if current user is NOT in collaborators
        // (if they're not a collaborator and can see the note, they're likely the owner)
        const isCollaborator = collaborators.some(c => c.id === currentUser?.id);
        setIsNoteOwner(!isCollaborator);
      }
    } catch (e) {
      console.error("Failed to load collaborators:", e);
      setNoteCollaborators([]);
      setIsNoteOwner(false);
    }
  }, [token, notes, currentUser]);

  const showCollaborationDialog = useCallback((noteId) => {
    setCollaborationDialogNoteId(noteId);
    setCollaborationDialogOpen(true);
    loadNoteCollaborators(noteId);
  }, [loadNoteCollaborators]);

  const removeCollaborator = async (collaboratorId, noteId = null) => {
    try {
      const targetNoteId = noteId || collaborationDialogNoteId || activeId;
      if (!targetNoteId) return;
      await api(`/notes/${targetNoteId}/collaborate/${collaboratorId}`, {
        method: "DELETE",
        token
      });
      showToast("Collaborator removed successfully", "success");
      if (collaborationDialogNoteId) {
        loadNoteCollaborators(collaborationDialogNoteId);
      }
      if (activeId) {
        await loadCollaboratorsForAddModal(activeId);
      }
      invalidateNotesCache();
    } catch (e) {
      showToast(e.message || "Failed to remove collaborator", "error");
    }
  };

  const loadCollaboratorsForAddModal = useCallback(async (noteId) => {
    try {
      const collaborators = await api(`/notes/${noteId}/collaborators`, { token });
      setAddModalCollaborators(collaborators || []);
    } catch (e) {
      console.error("Failed to load collaborators:", e);
      setAddModalCollaborators([]);
    }
  }, [token]);

  // Search users for collaboration dropdown
  const searchUsers = useCallback(async (query) => {
    setLoadingUsers(true);
    try {
      const searchQuery = query && query.trim().length > 0 ? query.trim() : "";
      const users = await api(`/users/search?q=${encodeURIComponent(searchQuery)}`, { token });
      // Filter out current user and existing collaborators
      const existingCollaboratorIds = new Set(addModalCollaborators.map(c => c.id));
      const filtered = users.filter(u =>
        u.id !== currentUser?.id && !existingCollaboratorIds.has(u.id)
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(filtered.length > 0);
    } catch (e) {
      console.error("Failed to search users:", e);
      setFilteredUsers([]);
      setShowUserDropdown(false);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, addModalCollaborators, currentUser]);

  // Update dropdown position based on input field
  const updateDropdownPosition = useCallback(() => {
    if (collaboratorInputRef.current) {
      const rect = collaboratorInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // fixed positioning is relative to viewport
        left: rect.left,
        width: rect.width
      });
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        collaboratorInputRef.current &&
        !collaboratorInputRef.current.contains(event.target) &&
        !event.target.closest('[data-user-dropdown]')
      ) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      updateDropdownPosition();
      // Use setTimeout to ensure the portal is rendered
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [showUserDropdown, updateDropdownPosition]);

  // Load collaborators when Add Collaborator modal opens
  useEffect(() => {
    if (collaborationModalOpen && activeId) {
      loadCollaboratorsForAddModal(activeId);
    }
  }, [collaborationModalOpen, activeId, loadCollaboratorsForAddModal]);

  const addCollaborator = async (username) => {
    try {
      if (!activeId) return;

      // Add collaborator to the note
      const result = await api(`/notes/${activeId}/collaborate`, {
        method: "POST",
        token,
        body: { username }
      });

      // Update local note with collaborator info
      setNotes((prev) => prev.map((n) =>
        String(n.id) === String(activeId)
          ? {
            ...n,
            collaborators: [...(n.collaborators || []), username],
            lastEditedBy: currentUser?.email || currentUser?.name,
            lastEditedAt: new Date().toISOString()
          }
          : n
      ));

      showToast(`Added ${username} as collaborator successfully!`, "success");
      setCollaboratorUsername("");
      setShowUserDropdown(false);
      setFilteredUsers([]);
      // Reload collaborators for both dialogs
      await loadCollaboratorsForAddModal(activeId);
      if (collaborationDialogNoteId === activeId) {
        loadNoteCollaborators(activeId);
      }
    } catch (e) {
      showToast(e.message || "Failed to add collaborator", "error");
    }
  };

  /** -------- Secret Key actions -------- */
  const downloadSecretKey = async () => {
    try {
      const data = await api("/secret-key", { method: "POST", token });
      if (!data?.key) throw new Error("Secret key not returned by server.");
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const fname = `glass-keep-secret-key-${ts}.txt`;
      const content =
        `Glass Keep — Secret Recovery Key\n\n` +
        `Keep this key safe. Anyone with this key can sign in as you.\n\n` +
        `Secret Key:\n${data.key}\n\n` +
        `Instructions:\n` +
        `1) Go to the login page.\n` +
        `2) Click "Forgot username/password?".\n` +
        `3) Choose "Sign in with Secret Key" and paste this key.\n`;
      downloadText(fname, content);
      alert("Secret key downloaded. Store it in a safe place.");
    } catch (e) {
      alert(e.message || "Could not generate secret key.");
    }
  };

  /** -------- Bulk Actions -------- */

  /** Add copy buttons to code (view mode, text notes) */
  useEffect(() => {
    if (!(open && viewMode && mType === "text")) return;
    const root = noteViewRef.current;
    if (!root) return;

    const attach = () => {
      // Wrap code blocks so the copy button can stay fixed even on horizontal scroll
      root.querySelectorAll("pre").forEach((pre) => {
        // Ensure wrapper
        let wrapper = pre.closest('.code-block-wrapper');
        if (!wrapper) {
          wrapper = document.createElement('div');
          wrapper.className = 'code-block-wrapper';
          pre.parentNode?.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);
        }
        if (wrapper.querySelector('.code-copy-btn')) return;
        const btn = document.createElement("button");
        btn.className = "code-copy-btn";
        btn.textContent = "Copy";
        btn.setAttribute("data-copy-btn", "1");
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const codeEl = pre.querySelector("code");
          const text = codeEl ? codeEl.textContent : pre.textContent;
          navigator.clipboard?.writeText(text || "");
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        });
        wrapper.appendChild(btn);
      });

      // Inline code
      root.querySelectorAll("code").forEach((code) => {
        if (code.closest("pre")) return; // skip fenced
        if (
          code.nextSibling &&
          code.nextSibling.nodeType === 1 &&
          code.nextSibling.classList?.contains("inline-code-copy-btn")
        )
          return;
        const btn = document.createElement("button");
        btn.className = "inline-code-copy-btn";
        btn.textContent = "Copy";
        btn.setAttribute("data-copy-btn", "1");
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          navigator.clipboard?.writeText(code.textContent || "");
          btn.textContent = "Copied";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        });
        code.insertAdjacentElement("afterend", btn);
      });
    };

    attach();
    // Ensure buttons after layout/async renders
    requestAnimationFrame(attach);
    const t1 = setTimeout(attach, 50);
    const t2 = setTimeout(attach, 200);

    // Observe DOM changes while in view mode
    const mo = new MutationObserver(() => attach());
    try {
      mo.observe(root, { childList: true, subtree: true });
    } catch (e) { }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      mo.disconnect();
    };
  }, [open, viewMode, mType, mBody, activeId]);

  /** -------- Modal Component Integration -------- */
  const modal = modalOpen ? <Modal /> : null;

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser?.email && route !== "#/notes" && route !== "#/admin") navigate("#/notes");
  }, [currentUser]); // eslint-disable-line

  // Close sidebar when navigating away or opening modal
  useEffect(() => {
    if (open) setSidebarOpen(false);
  }, [open]);

  // ---- Routing ----
  if (route === "#/admin") {
    if (!currentUser?.email) {
      return (
        <AuthShell title="Admin Panel" dark={dark} onToggleDark={toggleDark}>
          <p className="text-sm mb-4">
            You must sign in as an admin to view this page.
          </p>
          <button
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover"
            onClick={() => (window.location.hash = "#/login")}
          >
            Go to Sign In
          </button>
        </AuthShell>
      );
    }
    if (!currentUser?.is_admin) {
      return (
        <AuthShell title="Admin Panel" dark={dark} onToggleDark={toggleDark}>
          <p className="text-sm">Not authorized. Your account is not an admin.</p>
          <button
            className="mt-4 px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10"
            onClick={() => (window.location.hash = "#/notes")}
          >
            Back to Notes
          </button>
        </AuthShell>
      );
    }
    return (
      <AdminView
        token={token}
        currentUser={currentUser}
        dark={dark}
        onToggleDark={toggleDark}
        onBackToNotes={() => (window.location.hash = "#/notes")}
      />
    );
  }

  if (!currentUser?.email) {
    if (route === "#/register") {
      return (
        <RegisterView
          dark={dark}
          onToggleDark={toggleDark}
          onRegister={register}
          goLogin={() => navigate("#/login")}
        />
      );
    }
    if (route === "#/login-secret") {
      return (
        <SecretLoginView
          dark={dark}
          onToggleDark={toggleDark}
          onLoginWithKey={signInWithSecret}
          goLogin={() => navigate("#/login")}
        />
      );
    }
    return (
      <LoginView
        dark={dark}
        onToggleDark={toggleDark}
        onLogin={signIn}
        goRegister={() => navigate("#/register")}
        goSecret={() => navigate("#/login-secret")}
        allowRegistration={allowRegistration}
      />
    );
  }

  return (
    <>
      {/* Tag Sidebar / Drawer */}
      <TagSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tagsWithCounts={tagsWithCounts}
        activeTag={tagFilter}
        onSelect={(tag) => setTagFilter(tag)}
        dark={dark}
        permanent={alwaysShowSidebarOnWide && windowWidth >= 700}
        width={sidebarWidth}
        onResize={setSidebarWidth}
      />

      {/* Settings Panel - Now rendered inline in DashboardLayout, keeping this commented in case valid uses remain 
      <SettingsPanel
        open={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        dark={dark}
        onExportAll={exportAll}
        onImportAll={() => importFileRef.current?.click()}
        onImportGKeep={() => gkeepFileRef.current?.click()}
        onImportMd={() => mdFileRef.current?.click()}
        onDownloadSecretKey={downloadSecretKey}
        alwaysShowSidebarOnWide={alwaysShowSidebarOnWide}
        setAlwaysShowSidebarOnWide={setAlwaysShowSidebarOnWide}
        localAiEnabled={localAiEnabled}
        setLocalAiEnabled={setLocalAiEnabled}
        showGenericConfirm={showGenericConfirm}
        showToast={showToast}
      />
      */}

      {/* Admin Panel */}
      {console.log("Rendering AdminPanel with:", { adminPanelOpen, adminSettings, allUsers: allUsers?.length })}
      <AdminPanel
        open={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
        dark={dark}
        adminSettings={adminSettings}
        allUsers={allUsers}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        updateAdminSettings={updateAdminSettings}
        createUser={createUser}
        deleteUser={deleteUser}
        updateUser={updateUser}
        currentUser={currentUser}
        showGenericConfirm={showGenericConfirm}
        showToast={showToast}
      />

      <NotesUI
        currentUser={currentUser}
        dark={dark}
        toggleDark={toggleDark}
        signOut={signOut}
        search={search}
        setSearch={setSearch}
        pinned={pinned}
        others={others}
        openModal={openModal}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        togglePin={togglePin}
        addImagesToState={addImagesToState}
        filteredEmptyWithSearch={filteredEmptyWithSearch}
        allEmpty={allEmpty}
        onExportAll={exportAll}
        onImportAll={importAll}
        onImportGKeep={importGKeep}
        onImportMd={importMd}
        onDownloadSecretKey={downloadSecretKey}
        importFileRef={importFileRef}
        gkeepFileRef={gkeepFileRef}
        mdFileRef={mdFileRef}
        headerMenuOpen={headerMenuOpen}
        setHeaderMenuOpen={setHeaderMenuOpen}
        headerMenuRef={headerMenuRef}
        headerBtnRef={headerBtnRef}
        openSidebar={() => setSidebarOpen(true)}
        activeTagFilter={tagFilter}
        setTagFilter={setTagFilter}
        tagsWithCounts={tagsWithCounts}
        // Admin Props
        adminSettings={adminSettings}
        allUsers={allUsers}
        newUserForm={newUserForm}
        setNewUserForm={setNewUserForm}
        updateAdminSettings={updateAdminSettings}
        createUser={createUser}
        deleteUser={deleteUser}
        updateUser={updateUser}
        showGenericConfirm={showGenericConfirm}
        showToast={showToast}
        sidebarPermanent={alwaysShowSidebarOnWide && windowWidth >= 700}
        sidebarWidth={sidebarWidth}
        alwaysShowSidebarOnWide={alwaysShowSidebarOnWide}
        setAlwaysShowSidebarOnWide={setAlwaysShowSidebarOnWide}
        backgroundImage={backgroundImage}
        setBackgroundImage={setBackgroundImage}
        backgroundOverlay={backgroundOverlay}
        setBackgroundOverlay={setBackgroundOverlay}
        accentColor={accentColor}
        setAccentColor={setAccentColor}
        cardTransparency={cardTransparency}
        setCardTransparency={setCardTransparency}
        // AI props
        localAiEnabled={localAiEnabled}
        setLocalAiEnabled={setLocalAiEnabled}
        aiResponse={aiResponse}
        setAiResponse={setAiResponse}
        isAiLoading={isAiLoading}
        aiLoadingProgress={aiLoadingProgress}
        onAiSearch={handleAiSearch}
        // loading
        notesLoading={notesLoading}
        // multi-select
        multiMode={multiMode}
        selectedIds={selectedIds}
        onStartMulti={onStartMulti}
        onExitMulti={onExitMulti}
        onToggleSelect={onToggleSelect}
        onSelectAllPinned={onSelectAllPinned}
        onSelectAllOthers={onSelectAllOthers}
        onBulkDelete={onBulkDelete}
        onBulkPin={onBulkPin}
        onBulkArchive={onBulkArchive}
        onBulkColor={onBulkColor}
        onBulkDownloadZip={onBulkDownloadZip}
        // view mode
        listView={listView}
        onToggleViewMode={onToggleViewMode}
        // SSE connection status
        sseConnected={sseConnected}
        isOnline={isOnline}
        loadNotes={loadNotes}
        loadArchivedNotes={loadArchivedNotes}
        // Admin panel
        openAdminPanel={openAdminPanel}
        // Settings panel
        openSettingsPanel={openSettingsPanel}
      />
      {modal}

      {/* Generic Confirmation Dialog */}
      {genericConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setGenericConfirmOpen(false)}
          />
          <div
            className="glass-card rounded-xl shadow-2xl w-[90%] max-w-sm p-6 relative"
            style={{ backgroundColor: dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">{genericConfirmConfig.title || "Confirm Action"}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {genericConfirmConfig.message}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10"
                onClick={() => setGenericConfirmOpen(false)}
              >
                {genericConfirmConfig.cancelText || "Cancel"}
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${genericConfirmConfig.danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-accent text-white hover:bg-accent-hover"}`}
                onClick={async () => {
                  setGenericConfirmOpen(false);
                  if (genericConfirmConfig.onConfirm) {
                    await genericConfirmConfig.onConfirm();
                  }
                }}
              >
                {genericConfirmConfig.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[60] space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-right-2 ${toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                }`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}