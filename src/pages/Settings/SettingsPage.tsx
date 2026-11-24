import React from "react";
import {
  Settings,
  ShieldCheck,
  ShieldAlert,
  Moon,
  Sun,
  Laptop,
  Lock,
  ExternalLink,
} from "lucide-react";
import { PermissionStatus } from "../../types/storage";

interface SettingsPageProps {
  theme: "system" | "light" | "dark";
  onChangeTheme: (theme: "system" | "light" | "dark") => void;
  permissionStatus?: PermissionStatus;
  onOpenFullDiskAccess: () => void;
  defaultScanPath: string;
  onChangeDefaultPath: (path: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  theme,
  onChangeTheme,
  permissionStatus,
  onOpenFullDiskAccess,
  defaultScanPath,
  onChangeDefaultPath,
}) => {
  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 select-none animate-in fade-in duration-150">
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings size={18} className="text-accent" />
          <span>Preferences & Security</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize NOVA&apos;s behavior, manage macOS permissions, and review security safeguards.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Default Scan Directory
        </h3>
        <input
          type="text"
          value={defaultScanPath}
          onChange={(e) => onChangeDefaultPath(e.target.value)}
          className="w-full px-3.5 py-2 rounded-xl bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border border-border-light dark:border-border-dark text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Appearance Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
          Appearance
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onChangeTheme("system")}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
              theme === "system"
                ? "border-accent bg-accent/5 text-accent shadow-sm"
                : "border-border-light dark:border-border-dark text-slate-600 dark:text-slate-400 hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark"
            }`}
          >
            <Laptop size={18} />
            <span>System Default</span>
          </button>

          <button
            onClick={() => onChangeTheme("light")}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
              theme === "light"
                ? "border-accent bg-accent/5 text-accent shadow-sm"
                : "border-border-light dark:border-border-dark text-slate-600 dark:text-slate-400 hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark"
            }`}
          >
            <Sun size={18} />
            <span>Light</span>
          </button>

          <button
            onClick={() => onChangeTheme("dark")}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-medium ${
              theme === "dark"
                ? "border-accent bg-accent/5 text-accent shadow-sm"
                : "border-border-light dark:border-border-dark text-slate-600 dark:text-slate-400 hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark"
            }`}
          >
            <Moon size={18} />
            <span>Dark</span>
          </button>
        </div>
      </div>

      {/* Permissions Section */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            macOS Privacy & Permissions
          </h3>
          <span
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
              permissionStatus?.has_full_disk_access
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {permissionStatus?.has_full_disk_access ? (
              <ShieldCheck size={14} />
            ) : (
              <ShieldAlert size={14} />
            )}
            <span>
              {permissionStatus?.has_full_disk_access
                ? "Full Disk Access Granted"
                : "Standard Access"}
            </span>
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Full Disk Access allows NOVA to thoroughly scan all user application
          caches, developer data, and external storage drives without permission
          interruptions.
        </p>

        <div className="flex items-center justify-between p-3.5 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-xl text-xs">
          <div className="text-slate-700 dark:text-slate-300">
            {permissionStatus?.description}
          </div>
          <button
            onClick={onOpenFullDiskAccess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors shrink-0 ml-4"
          >
            <span>Open System Settings</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>

      {/* Security & Safeguards Guarantee */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <Lock size={14} className="text-emerald-500" />
          <span>Security & Privacy Invariants</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-xl">
            <span className="font-semibold block mb-1">
              Protected System Hierarchies
            </span>
            <span className="text-[11px] text-slate-400">
              NOVA completely blocks operations touching /System, /usr, /bin,
              /sbin, /private, and core system folders.
            </span>
          </div>

          <div className="p-3 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-xl">
            <span className="font-semibold block mb-1">
              Trash-Only Deletion Protocol
            </span>
            <span className="text-[11px] text-slate-400">
              Files are never permanently unlinked by default. All operations
              move items to macOS Trash for easy recovery.
            </span>
          </div>

          <div className="p-3 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-xl">
            <span className="font-semibold block mb-1">
              100% Local Processing
            </span>
            <span className="text-[11px] text-slate-400">
              Zero telemetry, zero external network requests, zero cloud
              accounts. Your filesystem metadata stays strictly on your Mac.
            </span>
          </div>

          <div className="p-3 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-xl">
            <span className="font-semibold block mb-1">
              Symlink Boundary Protection
            </span>
            <span className="text-[11px] text-slate-400">
              The Rust scanner never follows directory symlinks, preventing
              infinite traversal cycles and external mutations.
            </span>
          </div>
        </div>
      </div>

      {/* Version Footer */}
      <div className="text-center text-xs text-slate-400 pt-2">
        NOVA Storage Utility v1.0.0 &bull; Built with Rust & Tauri 2 for macOS
      </div>
    </div>
  );
};
