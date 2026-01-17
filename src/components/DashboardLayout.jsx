import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Settings, Shield, LogOut, Search } from 'lucide-react';

export default function DashboardLayout({ 
  children, 
  activeSection, 
  onNavigate, 
  user, 
  onSearch,
  tags,
  onTagSelect,
  activeTag,
  isAdmin,
  title,
  onSignOut
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-gray-100 font-sans selection:bg-accent/30">
      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onNavigate={onNavigate} 
        className="flex-shrink-0 z-20"
        tags={tags}
        onTagSelect={onTagSelect}
        activeTag={activeTag}
        isAdmin={isAdmin}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-0 min-w-0">
        
        {/* Top Header / Bar - Refined Glass Style */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0c0c14]/50 backdrop-blur-xl z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white tracking-wide">
              {title || activeSection.charAt(0).toUpperCase() + activeSection.slice(1).replace('-', ' ')}
            </h1>
            
            {/* Search Bar - Refined */}
            <div className="hidden md:flex ml-4 items-center px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] focus-within:bg-white/[0.06] focus-within:border-[var(--color-accent)]/30 transition-all w-64 group">
              <Search size={16} className="text-gray-500 mr-2 group-focus-within:text-[var(--color-accent)] transition-colors" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                className="bg-transparent border-none outline-none text-sm text-gray-200 placeholder-gray-500 w-full"
                onChange={(e) => onSearch && onSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Status Indicator - More subtle */}
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor] animate-pulse" />
                <span className="text-xs font-medium text-emerald-400/80">Online</span>
             </div>

             {/* User Profile */}
             <div className="relative">
               <button 
                 onClick={() => setUserMenuOpen(!userMenuOpen)}
                 className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--color-accent)] to-violet-500 p-[1px] shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:scale-105 hover:shadow-[var(--color-accent)]/30 active:scale-95"
               >
                  <div className="w-full h-full rounded-[10px] bg-[#1a1a24] flex items-center justify-center text-xs font-bold uppercase text-white">
                      {user?.name?.[0] || 'U'}
                  </div>
               </button>

               {/* User Dropdown - Refined */}
               {userMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                   <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#16161c]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/50 py-1 z-50 animate-in fade-in slide-in-from-top-2">
                     <div className="px-4 py-3 border-b border-white/[0.06]">
                       <p className="text-sm font-semibold text-white">{user?.name || 'User'}</p>
                       <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                     </div>
                     
                     <div className="p-1">
                       <button 
                         onClick={() => { setUserMenuOpen(false); onNavigate('settings'); }}
                         className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                       >
                         <Settings size={16} />
                         Settings
                       </button>
                       {isAdmin && (
                         <button 
                           onClick={() => { setUserMenuOpen(false); onNavigate('admin'); }}
                           className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors"
                         >
                           <Shield size={16} />
                           Admin Panel
                         </button>
                       )}
                     </div>
                     
                     <div className="p-1 border-t border-white/[0.06]">
                        <button 
                         onClick={() => { setUserMenuOpen(false); onSignOut?.(); }}
                         className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                       >
                         <LogOut size={16} />
                         Sign Out
                       </button>
                     </div>
                   </div>
                 </>
               )}
             </div>
          </div>
        </header>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative scrollbar-thin scrollbar-thumb-white/10">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Background decorative elements - Softer */}
        <div className="fixed top-20 right-20 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-[150px] pointer-events-none -z-10" />
        <div className="fixed bottom-20 left-40 w-80 h-80 bg-violet-600/8 rounded-full blur-[120px] pointer-events-none -z-10" />
      </div>
    </div>
  );
}
