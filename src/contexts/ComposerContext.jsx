import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import { NotesContext } from './NotesContext';
import { uid, runFormat, fileToCompressedDataURL, handleSmartEnter } from '../utils/helpers';

export const ComposerContext = createContext();

/**
 * ComposerProvider Component
 * Manages the state of the note composer for creating new notes
 */
export function ComposerProvider({ children }) {
  const { createNote, isOnline } = useContext(NotesContext);

  // Core state
  const [type, setType] = useState("text"); // 'text' | 'checklist' | 'draw'
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState(""); // Comma-separated string as in App.jsx
  const [color, setColor] = useState("default");
  const [images, setImages] = useState([]);
  const [collapsed, setCollapsed] = useState(true);
  
  // Checklist state
  const [clItems, setClItems] = useState([]);
  const [clInput, setClInput] = useState("");

  // Drawing state
  const [drawingData, setDrawingData] = useState({ paths: [], dimensions: null });

  // UI state
  const [showFormatting, setShowFormatting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Refs
  const titleRef = useRef(null);
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const fmtBtnRef = useRef(null);
  const colorBtnRef = useRef(null);

  const reset = useCallback(() => {
    setTitle("");
    setContent("");
    setTags("");
    setImages([]);
    setColor("default");
    setClItems([]);
    setClInput("");
    setDrawingData({ paths: [], dimensions: null });
    setType("text");
    setCollapsed(true);
    setShowFormatting(false);
    setShowColorPicker(false);
    if (contentRef.current) contentRef.current.style.height = "auto";
  }, []);

  const addChecklistItem = useCallback(() => {
    if (!clInput.trim()) return;
    const newItem = {
      id: uid(),
      text: clInput.trim(),
      done: false,
    };
    setClItems(prev => [...prev, newItem]);
    setClInput("");
  }, [clInput]);

  const save = useCallback(async () => {
    if (!isOnline) return;

    const isText = type === "text";
    const isChecklist = type === "checklist";
    const isDraw = type === "draw";

    // Validation
    if (isText) {
      if (!title.trim() && !content.trim() && !tags.trim() && images.length === 0) return;
    } else if (isChecklist) {
      if (!title.trim() && clItems.length === 0) return;
    } else if (isDraw) {
      const drawPaths = Array.isArray(drawingData) ? drawingData : (drawingData?.paths || []);
      if (!title.trim() && drawPaths.length === 0) return;
    }

    const nowIso = new Date().toISOString();
    const newNote = {
      id: uid(),
      type: type,
      title: title.trim(),
      content: isText ? content : isDraw ? JSON.stringify(drawingData) : "",
      items: isChecklist ? clItems : [],
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      images: images,
      color: color,
      pinned: false,
      position: Date.now(),
      timestamp: nowIso,
      updated_at: nowIso,
    };

    try {
      await createNote(newNote);
      reset();
    } catch (e) {
      alert(e.message || "Failed to add note");
    }
  }, [isOnline, type, title, content, tags, images, clItems, drawingData, color, createNote, reset]);

  const onKeyDown = useCallback((e) => {
    // Ctrl+Enter or Cmd+Enter to save
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      save();
      return;
    }

    // Smart Enter
    if (e.key !== "Enter" || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    const el = contentRef.current;
    if (!el) return;
    const value = content;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const res = handleSmartEnter(value, start, end);
    if (res) {
      e.preventDefault();
      setContent(res.text);
      requestAnimationFrame(() => {
        try { el.setSelectionRange(res.range[0], res.range[1]); } catch (e) { }
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
      });
    }
  }, [content, setContent, save]);

  const format = useCallback((t) => {
    runFormat(() => content, setContent, contentRef, t);
  }, [content, setContent]);

  const handleImageUpload = useCallback(async (files) => {
    const results = [];
    for (const f of files) {
      try {
        const src = await fileToCompressedDataURL(f);
        results.push({ id: uid(), src, name: f.name });
      } catch (e) { }
    }
    if (results.length) setImages((prev) => [...prev, ...results]);
  }, [setImages]);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((im) => im.id !== id));
  }, [setImages]);

  const value = {
    // State
    type, setType,
    title, setTitle,
    content, setContent,
    tags, setTags,
    color, setColor,
    images, setImages,
    collapsed, setCollapsed,
    clItems, setClItems,
    clInput, setClInput,
    drawingData, setDrawingData,
    showFormatting, setShowFormatting,
    showColorPicker, setShowColorPicker,

    // Refs
    titleRef,
    contentRef,
    fileInputRef,
    fmtBtnRef,
    colorBtnRef,

    // Actions
    reset,
    addChecklistItem,
    onKeyDown,
    format,
    handleImageUpload,
    removeImage,
    save
  };

  return (
    <ComposerContext.Provider value={value}>
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposer() {
  const context = useContext(ComposerContext);
  if (!context) {
    throw new Error('useComposer must be used within ComposerProvider');
  }
  return context;
}
