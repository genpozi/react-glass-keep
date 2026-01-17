import React, { useEffect } from 'react';
import { useSettings, useUI } from '../contexts';
import { SettingsIcon, CloseIcon } from './Icons';
import { BACKGROUNDS } from '../backgrounds';
import { ACCENT_COLORS, THEME_PRESETS, TRANSPARENCY_PRESETS } from '../themes';

export function SettingsPanel({ 
  inline, 
  onExportAll, onImportAll, onImportGKeep, onImportMd, onDownloadSecretKey, // These actions might need to be passed or moved to context/helpers
  ...props 
}) {
  const { 
    dark, 
    backgroundImage, setBackgroundImage, 
    backgroundOverlay, setBackgroundOverlay, 
    accentColor, setAccentColor, 
    cardTransparency, setCardTransparency,
    alwaysShowSidebarOnWide, setAlwaysShowSidebarOnWide,
    localAiEnabled, setLocalAiEnabled
  } = useSettings();

  const { 
    settingsPanelOpen, setSettingsPanelOpen,
    showToast, showGenericConfirm
  } = useUI();

  const open = inline ? true : (props.open !== undefined ? props.open : settingsPanelOpen);
  const onClose = props.onClose || (() => setSettingsPanelOpen(false));

  // Prevent body scroll when settings panel is open
  useEffect(() => {
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

  if (!open && !inline) return null;

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
                      if (showGenericConfirm) {
                        showGenericConfirm({
                          title: "Enable AI Assistant?",
                          message: "This will download a ~700MB AI model (Llama-3.2-1B) to the server and may use significant CPU resources. The download will happen in the background. Continue?",
                          confirmText: "Enable AI",
                          cancelText: "Cancel",
                          danger: false,
                          onConfirm: async () => {
                            setLocalAiEnabled(true);
                            if (showToast) showToast("AI Assistant enabled. Model will download on first use.", "success");
                          }
                        });
                      } else {
                        setLocalAiEnabled(true);
                      }
                    } else {
                      // Disable without confirmation
                      setLocalAiEnabled(false);
                      if (showToast) showToast("AI Assistant disabled", "info");
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
