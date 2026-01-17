import React, { useMemo } from 'react';
import { PinFilled, PinOutline } from './Icons';
import { DrawingPreview } from './DrawingPreview';
import { ChecklistRow } from './ChecklistRow';
import { useModal } from '../contexts/ModalContext';
import { useNotes } from '../contexts/NotesContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useUI } from '../contexts/UIContext';
import { bgFor } from '../utils/helpers';

/**
 * mdToPlain - Convert markdown to plain text (imported from App.jsx helpers)
 * bgFor - Get background color for note (imported from App.jsx helpers)
 */
const DEFAULT_TRANSPARENCY = 'medium';

// Helper functions - these should ideally come from a utils file
const mdToPlain = (md) => {
  if (!md || typeof md !== 'string') return '';
  const text = md
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/>\s(.+?)$/gm, '$1');
  return text.replace(/\n{3,}/g, '\n\n');
};

/**
 * NoteCard Component
 * Displays a note card with preview, actions, and drag/drop support
 */
export function NoteCard({
  n,
  multiMode = false,
  selected = false,
  onToggleSelect = () => {},
  disablePin = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const { openNote } = useModal();
  const { togglePin, updateChecklistItem } = useNotes();
  const { currentUser } = useAuth();
  const { dark, transparency: globalTransparency } = useSettings();
  const { isOnline } = useUI();
  const isChecklist = n.type === 'checklist';
  const isDraw = n.type === 'draw';
  const previewText = useMemo(() => mdToPlain(n.content || ''), [n.content]);
  const MAX_CHARS = 600;
  const isLong = previewText.length > MAX_CHARS;
  const displayText = isLong ? previewText.slice(0, MAX_CHARS).trimEnd() + '…' : previewText;

  const total = (n.items || []).length;
  const done = (n.items || []).filter((i) => i.done).length;
  const sortedItems = (n.items || []).sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });
  const visibleItems = sortedItems.slice(0, 8);
  const extraCount = total > visibleItems.length ? total - visibleItems.length : 0;

  const imgs = n.images || [];
  const mainImg = imgs[0];

  const MAX_TAG_CHIPS = 4;
  const allTags = Array.isArray(n.tags) ? n.tags : [];
  const showEllipsisChip = allTags.length > MAX_TAG_CHIPS;
  const displayTags = allTags.slice(0, MAX_TAG_CHIPS);

  const group = n.pinned ? 'pinned' : 'others';

  return (
    <div
      draggable={!multiMode}
      onDragStart={(e) => {
        if (!multiMode) onDragStart(n.id, e);
      }}
      onDragOver={(e) => {
        if (!multiMode) onDragOver(n.id, group, e);
      }}
      onDragLeave={(e) => {
        if (!multiMode) onDragLeave(e);
      }}
      onDrop={(e) => {
        if (!multiMode) onDrop(n.id, group, e);
      }}
      onDragEnd={(e) => {
        if (!multiMode) onDragEnd(e);
      }}
      onClick={(e) => {
        if (multiMode) {
          e.stopPropagation();
          onToggleSelect?.(n.id, !selected);
        } else {
          openNote(n);
        }
      }}
      className={`note-card glass-card rounded-xl p-4 mb-6 cursor-pointer transform hover:scale-[1.02] transition-transform duration-200 relative min-h-[54px] group ${
        multiMode && selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-transparent' : ''
      }`}
      style={{
        backgroundColor: bgFor ? bgFor(n.color, dark, n.transparency, globalTransparency) : undefined,
      }}
      data-id={n.id}
      data-group={group}
    >
      {/* Multi-select checkbox */}
      {multiMode && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
              selected
                ? 'bg-accent border-accent text-white'
                : 'border-gray-300 dark:border-gray-500 bg-white/80 dark:bg-gray-700/80 hover:border-accent'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect?.(n.id, !selected);
            }}
          >
            {selected && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Collaboration icon */}
      {((n.collaborators !== undefined && n.collaborators !== null) ||
        (n.user_id && currentUser && n.user_id !== currentUser.id)) && (
        <div className="absolute bottom-3 right-3 z-10">
          <div className="relative" title="Collaborated note">
            <svg className="w-5 h-5 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            <svg className="w-3 h-3 absolute -top-1 -right-1 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
          </div>
        </div>
      )}

      {/* Pin button */}
      {!multiMode && !disablePin && (
        <div className="absolute top-3 right-3 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: bgFor ? bgFor(n.color, dark, n.transparency, globalTransparency) : undefined,
            }}
          />
          <button
            aria-label={n.pinned ? 'Unpin note' : 'Pin note'}
            onClick={(e) => {
              if (disablePin) return;
              e.stopPropagation();
              togglePin(n.id, !n.pinned);
            }}
            className="relative rounded-full p-2 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent"
            title={n.pinned ? 'Unpin' : 'Pin'}
            disabled={!!disablePin}
          >
            {n.pinned ? <PinFilled /> : <PinOutline />}
          </button>
        </div>
      )}

      {/* Title */}
      {n.title && <h3 className="font-bold text-lg mb-2 break-words">{n.title}</h3>}

      {/* Main image */}
      {mainImg && (
        <div className="mb-3 relative overflow-hidden rounded-lg border border-[var(--border-light)]">
          <img src={mainImg.src} alt={mainImg.name || 'note image'} className="w-full h-40 object-cover" />
          {imgs.length > 1 && (
            <span className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
              +{imgs.length - 1} more
            </span>
          )}
        </div>
      )}

      {/* Content preview */}
      {!isChecklist && !isDraw ? (
        <div className="text-sm break-words whitespace-pre-wrap line-clamp-6">{displayText}</div>
      ) : isDraw ? (
        <DrawingPreview data={n.content} width={100} height={150} darkMode={dark} />
      ) : (
        <div className="space-y-2">
          {visibleItems.map((it) => (
            <ChecklistRow
              key={it.id}
              item={it}
              size="md"
              readOnly={true}
              showRemove={false}
              onToggle={async (checked, e) => {
                e?.stopPropagation();
                await updateChecklistItem(n.id, it.id, checked);
              }}
            />
          ))}
          {extraCount > 0 && <div className="text-xs text-gray-600 dark:text-gray-300">+{extraCount} more…</div>}
          <div className="text-xs text-gray-600 dark:text-gray-300">
            {done}/{total} completed
          </div>
        </div>
      )}

      {/* Tags */}
      {!!displayTags.length && (
        <div className="mt-4 text-xs flex flex-wrap gap-2">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
          {showEllipsisChip && (
            <span className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
              …
            </span>
          )}
        </div>
      )}
    </div>
  );
}
