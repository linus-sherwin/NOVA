import React from "react";
import {
  HardDrive,
  Sparkles,
  ArrowRight,
  Folder,
  Download,
  FileText,
  Monitor,
  LayoutGrid,
  Play,
} from "lucide-react";
import { QuickScanTarget, ScanResult } from "../../types/scan";
import { SystemStorageOverview } from "../../types/storage";
import { formatBytes, formatDuration } from "../../utils/formatters";

interface OverviewPageProps {
  storageOverview?: SystemStorageOverview;
  lastScan?: ScanResult | null;
  quickTargets: QuickScanTarget[];
  onStartScan: (path: string) => void;
  onNavigateTab: (tab: any) => void;
  onRevealInFinder: (path: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  storageOverview,
  lastScan,
  quickTargets,
  onStartScan,
  onNavigateTab,
  onRevealInFinder,
}) => {
  const primaryVolume = storageOverview?.primary_volume;
  const total = primaryVolume?.total_space_bytes || 1000000000000;
  const available = primaryVolume?.available_space_bytes || 400000000000;
  const used = primaryVolume?.used_space_bytes || 600000000000;
  const usedPct = primaryVolume?.used_percentage
    ? Math.round(primaryVolume.used_percentage)
    : 60;

  // Calculate potential cleanup sum from scan or estimates
  const potentialCleanupBytes = lastScan?.cleanup_opportunities.reduce(
    (acc, curr) => acc + curr.size_bytes,
    0,
  ) || 0;

  const targetIconMap: Record<string, any> = {
    Home: Folder,
    Download: Download,
    FileText: FileText,
    Monitor: Monitor,
    Grid: LayoutGrid,
    HardDrive: HardDrive,
  };

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Hero Storage Gauge & Summary */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Side: Circular Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="58"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="58"
                className="text-accent transition-all duration-700 ease-out"
                strokeWidth="12"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * Math.min(usedPct, 100)) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                {usedPct}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Used
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {primaryVolume?.name || "Macintosh HD"}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                {primaryVolume?.file_system || "APFS"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatBytes(used)} of {formatBytes(total)} consumed
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-slate-600 dark:text-slate-300">
                  Used: {formatBytes(used)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">
                  Free: {formatBytes(available)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action or Scan Status */}
        <div className="flex flex-col items-center md:items-end gap-3 text-center md:text-right">
          {potentialCleanupBytes > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              <Sparkles size={14} />
              <span>
                {formatBytes(potentialCleanupBytes)} potential cleanup identified
              </span>
            </div>
          )}

          <div className="text-xs text-slate-400">
            {lastScan
              ? `Last scan completed in ${formatDuration(lastScan.elapsed_secs)}`
              : "No scans recorded in current session"}
          </div>

          <button
            onClick={() => onStartScan(primaryVolume?.mount_point || "/")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Play size={14} className="fill-current" />
            <span>Scan Macintosh HD</span>
          </button>
        </div>
      </div>

      {/* Quick Scan Locations Grid */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 px-1">
          Quick Scan Locations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {quickTargets.map((target) => {
            const Icon = targetIconMap[target.icon_name] || Folder;
            return (
              <button
                key={target.id}
                onClick={() => onStartScan(target.path)}
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-accent dark:hover:border-accent p-4 rounded-xl flex items-center gap-3 transition-all text-left shadow-subtle group hover:shadow-md"
              >
                <div className="w-9 h-9 rounded-lg bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark group-hover:bg-accent/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:text-accent transition-colors">
                  <Icon size={18} />
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-accent truncate">
                    {target.name}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {target.path}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Summary Widget (Cleanup & Large Files) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cleanup Opportunities Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Cleanup Opportunities
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("cleanup")}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {lastScan && lastScan.cleanup_opportunities.length > 0 ? (
              <div className="divide-y divide-border-light dark:divide-border-dark text-xs">
                {lastScan.cleanup_opportunities.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div className="truncate max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {item.category_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {item.description}
                      </div>
                    </div>
                    <span className="font-semibold text-accent">
                      {formatBytes(item.size_bytes)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Run a scan to detect caches, development junk, and temporary data.
              </div>
            )}
          </div>

          {lastScan && lastScan.cleanup_opportunities.length > 0 && (
            <button
              onClick={() => onNavigateTab("cleanup")}
              className="mt-4 w-full py-2 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent font-medium text-xs transition-colors"
            >
              Review and Clean Files
            </button>
          )}
        </div>

        {/* Largest Files Card */}
        <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <HardDrive size={15} />
                </div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  Largest Files
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab("large-files")}
                className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight size={12} />
              </button>
            </div>

            {lastScan && lastScan.large_files.length > 0 ? (
              <div className="divide-y divide-border-light dark:divide-border-dark text-xs">
                {lastScan.large_files.slice(0, 4).map((file, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between group"
                  >
                    <div className="truncate max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {file.parent_dir}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatBytes(file.size_bytes)}
                      </span>
                      <button
                        onClick={() => onRevealInFinder(file.path)}
                        className="opacity-0 group-hover:opacity-100 text-[10px] text-accent hover:underline"
                      >
                        Finder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Run a scan to detect large media, archives, and disk images.
              </div>
            )}
          </div>

          {lastScan && (
            <button
              onClick={() => onNavigateTab("analyzer")}
              className="mt-4 w-full py-2 rounded-xl bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
            >
              Open Interactive Visualizer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
