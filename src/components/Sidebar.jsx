import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Bell, 
  Activity, 
  Settings, 
  Archive,
  Shield,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed, badge }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden
        ${active 
          ? 'bg-[var(--color-accent)]/15 text-white border border-[var(--color-accent)]/30 shadow-[0_0_20px_var(--color-accent-glow)]' 
          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }
      `}
      title={collapsed ? label : undefined}
    >
      {/* Active glow effect */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent pointer-events-none" />
      )}
      
      <Icon 
        size={20} 
        className={`relative z-10 transition-colors flex-shrink-0 ${active ? 'text-[var(--color-accent)]' : 'text-gray-500 group-hover:text-gray-300'}`} 
      />
      
      {!collapsed && (
        <span className="relative z-10 text-sm font-medium tracking-wide flex-1 text-left truncate">
          {label}
        </span>
      )}
      
      {!collapsed && badge && (
        <span className="relative z-10 text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-medium">
          {badge}
        </span>
      )}
      
      {active && !collapsed && !badge && (
        <div className="relative z-10 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]" />
      )}
    </button>
  );
};

const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) return <div className="h-px bg-white/5 mx-2 my-4" />;
  return (
    <div className="px-3 mb-2 mt-6 text-[10px] font-bold text-gray-500/80 uppercase tracking-[0.2em]">
      {label}
    </div>
  );
};

export default function Sidebar({ 
  activeSection = 'overview', 
  onNavigate, 
  className = '', 
  tags = [], 
  onTagSelect,
  activeTag,
  isAdmin,
  collapsed,
  onToggleCollapse
}) {
  return (
    <aside 
      className={`
        flex flex-col h-full transition-all duration-300 ease-out relative
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${className}
      `}
    >
      {/* Glass background with unified styling */}
      <div className="absolute inset-0 bg-[#0c0c14]/70 backdrop-blur-2xl border-r border-white/[0.06]" />
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent pointer-events-none" />
      
      {/* Inner glow at top matching accent */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[var(--color-accent)]/[0.03] to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="relative h-16 flex items-center px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 text-white min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/25 flex-shrink-0">
            <Layers size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-400 truncate">
              GlassKeep
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle - Always visible */}
      <button 
        onClick={onToggleCollapse}
        className={`
          absolute top-[72px] -right-3 z-30
          w-6 h-6 rounded-full 
          bg-[#1a1a24] border border-white/10
          flex items-center justify-center
          text-gray-400 hover:text-white hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-accent)]/10
          transition-all duration-200 shadow-lg
          hover:scale-110 active:scale-95
        `}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav Content */}
      <div className="relative flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
        
        <SectionLabel label="Views" collapsed={collapsed} />
        <SidebarItem 
          icon={LayoutDashboard} 
          label="All Notes" 
          active={activeSection === 'overview' && !activeTag} 
          onClick={() => { onNavigate('overview'); onTagSelect?.(null); }} 
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={Archive} 
          label="Archive" 
          active={activeTag === 'ARCHIVED' && activeSection === 'overview'} 
          onClick={() => { onNavigate('overview'); onTagSelect?.('ARCHIVED'); }}
          collapsed={collapsed}
        />
        
        {isAdmin && (
          <SidebarItem 
            icon={Shield} 
            label="Admin Panel" 
            active={activeSection === 'admin'} 
            onClick={() => onNavigate('admin')}
            collapsed={collapsed}
          />
        )}

        <SectionLabel label="System" collapsed={collapsed} />
        <SidebarItem 
          icon={Activity} 
          label="Health" 
          active={activeSection === 'health'} 
          onClick={() => onNavigate('health')}
          collapsed={collapsed}
        />
        <SidebarItem 
          icon={Bell} 
          label="Alerts" 
          active={activeSection === 'alerts'} 
          onClick={() => onNavigate('alerts')}
          collapsed={collapsed}
        />

        {tags && tags.length > 0 && (
          <>
            <SectionLabel label="Tags" collapsed={collapsed} />
            {tags.slice(0, collapsed ? 3 : 10).map(tag => (
              <SidebarItem 
                key={tag.name}
                icon={Hash} 
                label={tag.name} 
                active={activeTag === tag.name && activeSection === 'overview'} 
                badge={!collapsed ? tag.count : undefined}
                onClick={() => { onNavigate('overview'); onTagSelect?.(tag.name); }}
                collapsed={collapsed}
              />
            ))}
            {tags.length > 10 && !collapsed && (
              <button className="w-full text-xs text-gray-500 hover:text-gray-400 py-2 transition-colors">
                +{tags.length - 10} more tags
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom Section - Settings */}
      <div className="relative p-3 border-t border-white/[0.06]">
        <SidebarItem 
          icon={Settings} 
          label="Settings" 
          active={activeSection === 'settings'} 
          onClick={() => onNavigate('settings')}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}
