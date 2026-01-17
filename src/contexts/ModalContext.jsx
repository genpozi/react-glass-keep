import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotes } from './NotesContext';
import { useUI } from './UIContext';
import {
  api, uid, runFormat, handleSmartEnter,
  downloadText, mdForDownload, sanitizeFilename, solid, bgFor,
  fileToCompressedDataURL
} from '../utils/helpers';

export const ModalContext = createContext();

/**
 * ModalProvider Component
 * Manages the state and logic for the note editor modal
 */
export function ModalProvider({ children }) {
  const { token, currentUser } = useAuth();
  const { notes, setNotes, invalidateNotesCache } = useNotes();
  const { showToast } = useUI();

  // --- Core Modal State ---
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeNoteObj, setActiveNoteObj] = useState(null);
  const [mType, setMType] = useState("text"); // 'text' | 'checklist' | 'draw'
  const [mTitle, setMTitle] = useState("");
  const [mBody, setMBody] = useState("");
  const [mTagList, setMTagList] = useState([]);
  const [mColor, setMColor] = useState("default");
  const [mTransparency, setMTransparency] = useState(null);
  const [mImages, setMImages] = useState([]);
  const [mItems, setMItems] = useState([]);
  const [mInput, setMInput] = useState("");
  const [mDrawingData, setMDrawingData] = useState({ paths: [], dimensions: null });

  // --- UI State ---
  const [viewMode, setViewMode] = useState("edit"); // 'edit' | 'preview'
  const [showModalFmt, setShowModalFmt] = useState(false);
  const [modalMenuOpen, setModalMenuOpen] = useState(false);
  const [showModalColorPop, setShowModalColorPop] = useState(false);
  const [showModalTransPop, setShowModalTransPop] = useState(false);
  const [imgViewOpen, setImgViewOpen] = useState(false);
  const [mImagesViewIndex, setImgViewIndex] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistDragId, setChecklistDragId] = useState(null);

  // --- Collaboration State ---
  const [collaborationModalOpen, setCollaborationModalOpen] = useState(false);
  const [collaboratorUsername, setCollaboratorUsername] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [addModalCollaborators, setAddModalCollaborators] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // --- Refs ---
  const modalScrollRef = useRef(null);
  const modalFmtBtnRef = useRef(null);
  const modalMenuBtnRef = useRef(null);
  const modalColorBtnRef = useRef(null);
  const modalTransBtnRef = useRef(null);
  const modalFileRef = useRef(null);
  const mBodyRef = useRef(null);
  const noteViewRef = useRef(null);
  const collaboratorInputRef = useRef(null);
  const scrimClickStartRef = useRef(null);

  const resizeModalTextarea = useCallback(() => {
    if (mBodyRef.current) {
      mBodyRef.current.style.height = "auto";
      mBodyRef.current.style.height = mBodyRef.current.scrollHeight + "px";
    }
  }, []);
  const prevItemsRef = useRef([]);
  const prevDrawingRef = useRef(null);

  const openNote = useCallback(async (noteData) => {
    setActiveId(noteData.id);
    setActiveNoteObj(noteData);
    setMType(noteData.type || "text");
    setMTitle(noteData.title || "");
    setMBody(noteData.content || "");
    setMTagList(noteData.tags || []);
    setMColor(noteData.color || "default");
    setMTransparency(noteData.transparency);
    setMImages(noteData.images || []);
    setMItems(noteData.items || []);

    if (noteData.type === "draw" && noteData.content) {
      try {
        const parsed = JSON.parse(noteData.content);
        setMDrawingData(parsed);
        prevDrawingRef.current = parsed;
      } catch (e) {
        setMDrawingData({ paths: [], dimensions: null });
        prevDrawingRef.current = null;
      }
    } else {
      setMDrawingData({ paths: [], dimensions: null });
      prevDrawingRef.current = null;
    }

    prevItemsRef.current = noteData.items || [];
    setMInput("");
    setViewMode("edit");
    setOpen(true);

    // Load collaborators
    try {
      const collaborators = await api(`/notes/${noteData.id}/collaborators`, { token });
      setAddModalCollaborators(collaborators || []);
    } catch (e) {
      console.error("Failed to load collaborators:", e);
    }
  }, [token]);

  const closeModal = useCallback(() => {
    setOpen(false);
    setActiveId(null);
    setActiveNoteObj(null);
    setShowModalFmt(false);
    setModalMenuOpen(false);
    setShowModalColorPop(false);
    setShowModalTransPop(false);
    setCollaborationModalOpen(false);
    setConfirmDeleteOpen(false);
    setAddModalCollaborators([]);
  }, []);

  const saveModal = useCallback(async () => {
    if (!activeId) return;
    const base = {
      id: activeId,
      title: mTitle.trim(),
      tags: mTagList,
      images: mImages,
      color: mColor,
      transparency: mTransparency,
      pinned: !!notes.find(n => String(n.id) === String(activeId))?.pinned,
    };
    const payload =
      mType === "text"
        ? { ...base, type: "text", content: mBody, items: [] }
        : mType === "checklist"
          ? { ...base, type: "checklist", content: "", items: mItems }
          : { ...base, type: "draw", content: JSON.stringify(mDrawingData), items: [] };

    try {
      setIsSaving(true);
      await api(`/notes/${activeId}`, { method: "PUT", token, body: payload });
      invalidateNotesCache();

      const nowIso = new Date().toISOString();
      setNotes((prev) => prev.map((n) =>
        String(n.id) === String(activeId) ? {
          ...n,
          ...payload,
          updated_at: nowIso,
          lastEditedBy: currentUser?.email || currentUser?.name,
          lastEditedAt: nowIso
        } : n
      ));
      closeModal();
    } catch (e) {
      showToast(e.message || "Failed to save note", "error");
    } finally {
      setIsSaving(false);
    }
  }, [activeId, mTitle, mTagList, mImages, mColor, mTransparency, notes, mType, mBody, mItems, mDrawingData, token, invalidateNotesCache, setNotes, currentUser, closeModal, showToast]);

  const deleteModal = useCallback(async () => {
    if (!activeId) return;
    try {
      const note = notes.find(n => String(n.id) === String(activeId));
      if (note && note.user_id !== currentUser?.id) {
        showToast("You can't delete this note as you don't own it", "error");
        return;
      }
      await api(`/notes/${activeId}`, { method: "DELETE", token });
      invalidateNotesCache();
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(activeId)));
      closeModal();
      showToast("Note deleted successfully", "success");
    } catch (e) {
      showToast(e.message || "Delete failed", "error");
    }
  }, [activeId, notes, currentUser, token, invalidateNotesCache, setNotes, closeModal, showToast]);

  const formatModal = useCallback((type) => {
    const result = runFormat(() => mBody, setMBody, mBodyRef, type);
    if (result && typeof result === 'object' && result.text !== undefined) {
      setMBody(result.text);
    }
  }, [mBody]);

  const handleDownloadNote = useCallback(() => {
    if (!activeNoteObj) return;
    const filename = sanitizeFilename(mTitle || "note") + ".md";
    const content = mdForDownload({ ...activeNoteObj, title: mTitle, content: mBody, tags: mTagList, items: mItems });
    downloadText(filename, content);
  }, [activeNoteObj, mTitle, mBody, mTagList, mItems]);


  const addTags = useCallback((raw) => {
    const parts = raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    setMTagList((prev) => {
      const set = new Set(prev.map((x) => x.toLowerCase()));
      const merged = [...prev];
      for (const p of parts) {
        if (!set.has(p.toLowerCase())) {
          merged.push(p);
          set.add(p.toLowerCase());
        }
      }
      return merged;
    });
  }, []);

  const handleTagKeyDown = useCallback((e) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      if (tagInput.trim()) {
        addTags(tagInput);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput) {
      setMTagList((prev) => prev.slice(0, -1));
    }
  }, [tagInput, addTags]);

  const handleTagBlur = useCallback(() => {
    if (tagInput.trim()) {
      addTags(tagInput);
      setTagInput("");
    }
  }, [tagInput, addTags]);

  const handleTagPaste = useCallback((e) => {
    const text = e.clipboardData?.getData("text");
    if (text && text.includes(",")) {
      e.preventDefault();
      addTags(text);
    }
  }, [addTags]);

  const onModalBodyClick = useCallback((e) => {
    if (!(viewMode === "preview" && mType === "text")) return;
    const a = e.target.closest("a");
    if (a) {
      const href = a.getAttribute("href") || "";
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        e.preventDefault();
        e.stopPropagation();
        window.open(href, "_blank", "noopener,noreferrer");
      }
    }
  }, [viewMode, mType]);

  const openImageViewer = useCallback((index) => {
    setImgViewIndex(index);
    setImgViewOpen(true);
  }, []);

  const closeImageViewer = useCallback(() => setImgViewOpen(false), []);

  const nextImage = useCallback(() => {
    setImgViewIndex((i) => (i + 1) % mImages.length);
  }, [mImages.length]);

  const prevImage = useCallback(() => {
    setImgViewIndex((i) => (i - 1 + mImages.length) % mImages.length);
  }, [mImages.length]);

  const addImagesToModal = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    const results = [];
    for (const f of files) {
      try {
        const src = await fileToCompressedDataURL(f);
        results.push({ id: uid(), src, name: f.name });
      } catch (e) {
        console.error("Image load failed", e);
      }
    }
    if (results.length) {
      setMImages((prev) => [...prev, ...results]);
    }
  }, []);

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

  const addCollaborator = useCallback(async (username) => {
    try {
      if (!activeId) return;
      await api(`/notes/${activeId}/collaborate`, {
        method: "POST",
        token,
        body: { username }
      });
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
      await loadCollaboratorsForAddModal(activeId);
    } catch (e) {
      showToast(e.message || "Failed to add collaborator", "error");
    }
  }, [activeId, token, currentUser, setNotes, showToast, loadCollaboratorsForAddModal]);

  const removeCollaborator = useCallback(async (username) => {
    try {
      if (!activeId) return;
      await api(`/notes/${activeId}/collaborate`, {
        method: "DELETE",
        token,
        body: { username }
      });
      setNotes((prev) => prev.map((n) =>
        String(n.id) === String(activeId)
          ? {
            ...n,
            collaborators: (n.collaborators || []).filter(u => u !== username),
            lastEditedBy: currentUser?.email || currentUser?.name,
            lastEditedAt: new Date().toISOString()
          }
          : n
      ));
      showToast(`Removed collaborator ${username}`, "success");
      await loadCollaboratorsForAddModal(activeId);
    } catch (e) {
      showToast(e.message || "Failed to remove collaborator", "error");
    }
  }, [activeId, token, currentUser, setNotes, showToast, loadCollaboratorsForAddModal]);

  const onMChecklistDragStart = useCallback((e, itemId) => {
    setChecklistDragId(itemId);
    e.dataTransfer.setData("application/json", JSON.stringify({ source: "checklist-modal", id: itemId }));
  }, []);

  const onMChecklistDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const onMChecklistDrop = useCallback((e, targetId) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json") || '{}');
      if (data.source !== "checklist-modal") return;
      const sourceId = data.id;
      if (String(sourceId) === String(targetId)) return;

      const items = [...mItems];
      const sourceIdx = items.findIndex(i => String(i.id) === String(sourceId));
      const targetIdx = items.findIndex(i => String(i.id) === String(targetId));
      if (sourceIdx === -1 || targetIdx === -1) return;

      const [removed] = items.splice(sourceIdx, 1);
      items.splice(targetIdx, 0, removed);
      setMItems(items);
    } catch (err) { }
    setChecklistDragId(null);
  }, [mItems]);

  const value = {
    // State
    open, setOpen,
    activeId, setActiveId,
    activeNoteObj, setActiveNoteObj,
    mType, setMType,
    mTitle, setMTitle,
    mBody, setMBody,
    mTagList, setMTagList,
    mColor, setMColor,
    mTransparency, setMTransparency,
    mImages, setMImages,
    mItems, setMItems,
    mInput, setMInput,
    mDrawingData, setMDrawingData,
    viewMode, setViewMode,
    showModalFmt, setShowModalFmt,
    modalMenuOpen, setModalMenuOpen,
    showModalColorPop, setShowModalColorPop,
    showModalTransPop, setShowModalTransPop,
    imgViewOpen, setImgViewOpen,
    mImagesViewIndex, setImgViewIndex,
    tagInput, setTagInput,
    confirmDeleteOpen, setConfirmDeleteOpen,
    isSaving, setIsSaving,
    checklistDragId, setChecklistDragId,
    collaborationModalOpen, setCollaborationModalOpen,
    collaboratorUsername, setCollaboratorUsername,
    showUserDropdown, setShowUserDropdown,
    filteredUsers, setFilteredUsers,
    addModalCollaborators, setAddModalCollaborators,
    loadingUsers, setLoadingUsers,
    dropdownPosition, setDropdownPosition,

    // Refs
    onMChecklistDragStart, onMChecklistDragOver, onMChecklistDrop,
    modalScrollRef,
    modalFmtBtnRef,
    modalMenuBtnRef,
    modalColorBtnRef,
    modalTransBtnRef,
    modalFileRef,
    mBodyRef,
    noteViewRef,
    collaboratorInputRef,
    scrimClickStartRef,

    // Actions
    openNote,
    closeModal,
    saveModal,
    deleteModal,
    formatModal,
    handleDownloadNote,
    addCollaborator,
    removeCollaborator,
    searchUsers,
    loadCollaboratorsForAddModal,
    addTags,
    handleTagKeyDown,
    handleTagBlur,
    handleTagPaste,
    onModalBodyClick,
    openImageViewer,
    closeImageViewer,
    nextImage,
    prevImage,
    addImagesToModal,
    resizeModalTextarea,
    handleSmartEnter,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * useModal Hook
 * Convenience hook to access modal context
 */
export function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
}
