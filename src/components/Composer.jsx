import React, { useEffect } from 'react';
import { useComposer, useSettings, useNotes } from '../contexts';
import { bgFor, solid } from '../utils/helpers';
import { Popover } from './Popover';
import { ColorDot } from './ColorDot';
import { FormatToolbar } from './FormatToolbar';
import { ChecklistRow } from './ChecklistRow';
import DrawingCanvas from '../DrawingCanvas';
import { FormatIcon } from './Icons';
import { ACCENT_COLORS } from '../themes';

const COLOR_ORDER = [
  'default', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'darkblue', 'purple', 'pink', 'brown', 'gray'
];

const LIGHT_COLORS = {
  default: true,
  red: true,
  orange: true,
  yellow: true,
  green: true,
  teal: true,
  blue: true,
  darkblue: true,
  purple: true,
  pink: true,
  brown: true,
  gray: true
};

export function Composer() {
  const {
    type, setType,
    title, setTitle,
    content, setContent,
    tags, setTags,
    color, setColor,
    images,
    collapsed, setCollapsed,
    clItems,
    clInput, setClInput,
    drawingData, setDrawingData,
    showFormatting, setShowFormatting,
    showColorPicker, setShowColorPicker,
    titleRef,
    contentRef,
    fileInputRef,
    fmtBtnRef,
    colorBtnRef,
    addChecklistItem,
    onKeyDown,
    format,
    handleImageUpload,
    removeImage,
    save
  } = useComposer();

  const { dark } = useSettings();
  const { isOnline } = useNotes();

  // Auto-resize composer textarea
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.style.height = "auto";
    contentRef.current.style.height = contentRef.current.scrollHeight + "px";
  }, [content, type, contentRef]);

  if (!isOnline) {
    return (
      <div className="glass-card rounded-xl shadow-lg p-6 mb-8 text-center">
        <div className="text-orange-600 dark:text-orange-400 mb-2">
          <svg className="w-8 h-8 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">You're offline</h3>
        <p className="text-gray-600 dark:text-gray-400">Please go back online to add notes.</p>
      </div>
    );
  }

  return (
    <div
      className="glass-card rounded-xl shadow-lg p-4 mb-8 relative"
      style={{ backgroundColor: bgFor(color, dark) }}
    >
      {/* Collapsed single input */}
      {collapsed ? (
        <input
          value={content}
          onChange={() => {}}
          onFocus={() => {
            setCollapsed(false);
            setTimeout(() => titleRef.current?.focus(), 10);
          }}
          placeholder="Write a note..."
          className="w-full bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none p-2"
        />
      ) : (
        <>
          {/* Title */}
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-lg font-semibold placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none mb-2 p-2"
          />

          {/* Body, Checklist, or Drawing */}
          {type === "text" ? (
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Write a note..."
              className="w-full bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none p-2"
              rows={1}
            />
          ) : type === "checklist" ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={clInput}
                  onChange={(e) => setClInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }}
                  placeholder="List item…"
                  className="flex-1 bg-transparent placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none p-2 border-b border-[var(--border-light)]"
                />
                <button
                  onClick={addChecklistItem}
                  className="px-3 py-1.5 rounded-lg whitespace-nowrap bg-accent text-white hover:bg-accent-hover"
                >
                  Add
                </button>
              </div>
              {clItems.length > 0 && (
                <div className="space-y-2">
                  {clItems.map((it) => (
                    <ChecklistRow key={it.id} item={it} readOnly disableToggle />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <DrawingCanvas
              data={drawingData}
              onChange={setDrawingData}
              width={650}
              height={450}
              darkMode={dark}
              hideModeToggle={true}
            />
          )}

          {/* Composer image thumbnails */}
          {images.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((im) => (
                <div key={im.id} className="relative">
                  <img src={im.src} alt={im.name} className="h-16 w-24 object-cover rounded-md border border-[var(--border-light)]" />
                  <button
                    title="Remove image"
                    className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full w-5 h-5 text-xs"
                    onClick={() => removeImage(im.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Responsive composer footer */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-3 gap-3 relative">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              type="text"
              placeholder="Add tags (comma-separated)"
              className="w-full sm:flex-1 bg-transparent text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none p-2"
            />

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap sm:flex-none relative">
              {/* Formatting button (composer) - only for text mode */}
              {type === "text" && (
                <>
                  <button
                    ref={fmtBtnRef}
                    type="button"
                    onClick={() => setShowFormatting((v) => !v)}
                    className="px-2 py-1 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2 text-sm"
                    title="Formatting"
                  >
                    <FormatIcon /> Formatting
                  </button>
                  <Popover
                    anchorRef={fmtBtnRef}
                    open={showFormatting}
                    onClose={() => setShowFormatting(false)}
                  >
                    <FormatToolbar dark={dark} onAction={(t) => { setShowFormatting(false); format(t); }} />
                  </Popover>
                </>
              )}

              {/* Type selection buttons */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setType("text")}
                  className={`px-2 py-1 rounded-lg border text-sm ${type === "text"
                    ? 'bg-accent text-white border-accent'
                    : 'border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  title="Text note"
                >
                  📝
                </button>
                <button
                  type="button"
                  onClick={() => setType("checklist")}
                  className={`px-2 py-1 rounded-lg border text-sm ${type === "checklist"
                    ? 'bg-accent text-white border-accent'
                    : 'border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  title="Checklist"
                >
                  ✅
                </button>
                <button
                  type="button"
                  onClick={() => setType("draw")}
                  className={`px-2 py-1 rounded-lg border text-sm ${type === "draw"
                    ? 'bg-accent text-white border-accent'
                    : 'border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10'
                    }`}
                  title="Drawing"
                >
                  🖌️
                </button>
              </div>

              {/* Color dropdown (composer) */}
              <button
                ref={colorBtnRef}
                type="button"
                onClick={() => setShowColorPicker((v) => !v)}
                className="w-6 h-6 rounded-full border-2 border-[var(--border-light)] hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-gray-800 flex items-center justify-center"
                title="Color"
                style={{
                  backgroundColor: color === "default" ? "transparent" : solid(bgFor(color, dark)),
                  borderColor: color === "default" ? "#d1d5db" : solid(bgFor(color, dark)),
                }}
              >
                {color === "default" && (
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: dark ? "#1f2937" : "#fff" }} />
                )}
              </button>
              <Popover
                anchorRef={colorBtnRef}
                open={showColorPicker}
                onClose={() => setShowColorPicker(false)}
              >
                <div className={`fmt-pop ${dark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"}`}>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_ORDER.filter((name) => LIGHT_COLORS[name]).map((name) => (
                      <ColorDot
                        key={name}
                        name={name}
                        darkMode={dark}
                        selected={color === name}
                        onClick={(e) => {
                          e.stopPropagation();
                          setColor(name);
                          setShowColorPicker(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </Popover>

              {/* Add Image (composer) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleImageUpload(Array.from(e.target.files || []));
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0 text-lg"
                title="Add images"
              >
                🖼️
              </button>

              {/* Add Note */}
              <button
                onClick={save}
                className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent dark:focus:ring-offset-gray-800 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Add Note
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
