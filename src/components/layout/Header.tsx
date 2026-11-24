import React from "react";
import { ShieldCheck, ShieldAlert, Play, Square } from "lucide-react";
import { PermissionStatus } from "../../types/storage";

interface HeaderProps {
  title: string;
  subtitle?: string;
  permissionStatus?: PermissionStatus;
  isScanning: boolean;
  onQuickScan: () => void;
  onCancelScan: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  permissionStatus,
  isScanning,
  onQuickScan,
  onCancelScan,
  onOpenSettings,
}) => {
  return (
    <header className="h-14 border-b border-border-light dark:border-border-dark px-6 flex items-center justify-between select-none bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-slate-400 -mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Full Disk Access Pill */}
        {permissionStatus && (
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              permissionStatus.has_full_disk_access
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
            }`}
          >
            {permissionStatus.has_full_disk_access ? (
              <ShieldCheck size={13} />
            ) : (
              <ShieldAlert size={13} />
            )}
            <span>
              {permissionStatus.has_full_disk_access
                ? "Full Disk Access"
                : "Standard Access"}
            </span>
          </button>
        )}

        {/* Scan Actions */}
        {isScanning ? (
          <button
            onClick={onCancelScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors border border-red-500/20"
          >
            <Square size={13} className="fill-current" />
            <span>Cancel Scan</span>
          </button>
        ) : (
          <button
            onClick={onQuickScan}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent hover:bg-accent-hover text-white transition-colors shadow-sm"
          >
            <Play size={13} className="fill-current" />
            <span>Scan Home</span>
          </button>
        )}
      </div>
    </header>
  );
};

