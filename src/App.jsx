import React, { useEffect, useState } from "react";
import { useAuth, useSettings, useUI, useModal } from "./contexts";
import { api } from "./utils/helpers";

// Components
import NotesView from "./components/NotesView";
import AdminView from "./components/AdminView";
import Modal from "./components/Modal";
import { LoginView, RegisterView, SecretLoginView } from "./components/AuthViews";
import { SettingsPanel } from "./components/SettingsPanel";

export default function App() {
  const { currentUser, signIn, register, signInWithSecret } = useAuth();
  const { dark } = useSettings(); 
  const { toasts, genericConfirmOpen, setGenericConfirmOpen, genericConfirmConfig } = useUI();
  const { modalOpen } = useModal();
  
  // Routing State
  const [route, setRoute] = useState(window.location.hash || "#/notes");
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash || "#/notes");
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Registration Setting
  const [allowRegistration, setAllowRegistration] = useState(true);
  useEffect(() => {
    if (!currentUser) {
       // Only check if not logged in
       api("/auth/settings").then(res => {
         if (res && typeof res.allow_registration === 'boolean') {
           setAllowRegistration(res.allow_registration);
         }
       }).catch(() => {});
    }
  }, [currentUser]);

  // Determine View
  let currentView;
  if (!currentUser) {
    if (route === "#/register") {
      currentView = <RegisterView 
        onRegister={register} 
        goLogin={() => window.location.hash = "#/login"} 
      />;
    } else if (route === "#/login-secret") {
      currentView = <SecretLoginView 
        onLoginWithKey={signInWithSecret} 
        goLogin={() => window.location.hash = "#/login"} 
      />;
    } else {
      currentView = <LoginView 
        onLogin={signIn} 
        goRegister={() => window.location.hash = "#/register"} 
        goSecret={() => window.location.hash = "#/login-secret"}
        allowRegistration={allowRegistration}
      />;
    }
  } else {
    // Authenticated
    if (route === "#/admin") {
      currentView = <AdminView />;
    } else {
      // Default to Notes
      currentView = <NotesView />;
    }
  }

  return (
    <>
      {/* Main View */}
      {currentView}

      {/* Global Modals & Overlays */}
      {modalOpen && <Modal />}
      
      {/* Global Settings Panel (controlled by context) */}
      <SettingsPanel />

      {/* Generic Confirmation Dialog */}
      {genericConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setGenericConfirmOpen(false)}
          />
          <div
            className="glass-card rounded-xl shadow-2xl w-[90%] max-w-sm p-6 relative animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: dark ? "rgba(40,40,40,0.95)" : "rgba(255,255,255,0.95)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">{genericConfirmConfig.title || "Confirm Action"}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {genericConfirmConfig.message}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-[var(--border-light)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                onClick={() => setGenericConfirmOpen(false)}
              >
                {genericConfirmConfig.cancelText || "Cancel"}
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${genericConfirmConfig.danger 
                  ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20" 
                  : "bg-[var(--color-accent)] text-white hover:brightness-110 shadow-lg shadow-[var(--color-accent)]/20"}`}
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
        <div className="fixed top-4 right-4 z-[70] space-y-2 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-xl shadow-xl max-w-sm animate-in slide-in-from-right-2 flex items-center gap-3 border border-white/10 backdrop-blur-md pointer-events-auto ${toast.type === 'success'
                ? 'bg-emerald-600/90 text-white shadow-emerald-500/20'
                : toast.type === 'error'
                  ? 'bg-red-600/90 text-white shadow-red-500/20'
                  : 'bg-blue-600/90 text-white shadow-blue-500/20'
                }`}
            >
              {toast.type === 'success' ? (
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               ) : toast.type === 'error' ? (
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               ) : (
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               )
              }
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
