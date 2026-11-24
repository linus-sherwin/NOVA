import React from "react";
import {
  PieChart,
  HardDrive,
  Sparkles,
  Files,
  Copy,
  LayoutGrid,
  History,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { formatBytes } from "../../utils/formatters";

export type NavTab =
  | "overview"
  | "analyzer"
  | "cleanup"
  | "large-files"
  | "duplicates"
  | "applications"
  | "history"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  usedBytes?: number;
  totalBytes?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isDarkMode,
  onToggleTheme,
  usedBytes = 0,
  totalBytes = 0,
}) => {
  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: PieChart },
    { id: "analyzer" as NavTab, label: "Disk Analyzer", icon: HardDrive },
    { id: "cleanup" as NavTab, label: "Smart Cleanup", icon: Sparkles },
    { id: "large-files" as NavTab, label: "Large Files", icon: Files },
    { id: "duplicates" as NavTab, label: "Duplicate Finder", icon: Copy },
    { id: "applications" as NavTab, label: "Applications", icon: LayoutGrid },
    { id: "history" as NavTab, label: "Storage History", icon: History },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  const usedPct =
    totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

  return (
    <aside className="w-64 h-screen flex flex-col justify-between bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border-r border-border-light dark:border-border-dark select-none pt-9 pb-4 px-3">
      <div className="flex flex-col gap-6">
        {/* App Title & Logo */}
        <div className="px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              N
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                NOVA
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Storage Utility
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon
                  size={16}
                  className={isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Storage Utilization Pill & Theme Toggle */}
      <div className="flex flex-col gap-3 px-2">
        {totalBytes > 0 && (
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-3 shadow-subtle">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-slate-500">Macintosh HD</span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                {usedPct}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>{formatBytes(usedBytes)} used</span>
              <span>{formatBytes(totalBytes - usedBytes)} free</span>
            </div>
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon size={14} /> : <Sun size={14} />}
            <span>{isDarkMode ? "Dark Theme" : "Light Theme"}</span>
          </div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            {isDarkMode ? "Dark" : "Light"}
          </span>
        </button>
      </div>
    </aside>
  );
};

