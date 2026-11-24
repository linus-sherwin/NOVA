import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Trash2,
  CheckSquare,
  Square,
  ExternalLink,
} from "lucide-react";
import { DiscoveredCleanupItem } from "../../types/scan";
import { CleanupReport } from "../../types/cleanup";
import { formatBytes } from "../../utils/formatters";

interface CleanupPageProps {
  cleanupItems: DiscoveredCleanupItem[];
  onPreviewCleanup: (paths: string[]) => void;
  onRevealInFinder: (path: string) => void;
  cleanupReport?: CleanupReport | null;
  isExecuting?: boolean;
}

export const CleanupPage: React.FC<CleanupPageProps> = ({
  cleanupItems,
  onPreviewCleanup,
  onRevealInFinder,
  cleanupReport,
  isExecuting = false,
}) => {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const toggleSelect = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const toggleSelectAll = () => {
    if (selectedPaths.size === cleanupItems.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(cleanupItems.map((item) => item.path)));
    }
  };

  const totalSelectedBytes = cleanupItems
    .filter((item) => selectedPaths.has(item.path))
    .reduce((acc, curr) => acc + curr.size_bytes, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Smart Cleanup Engine
            </h2>
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck size={13} />
              macOS Trash Guaranteed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            NOVA strictly identifies safe caches, temporary build artifacts, and
            obsolete logs. User passwords, session tokens, browser history, and
            personal documents are never touched.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {selectedPaths.size > 0 && (
            <div className="text-right text-xs">
              <div className="text-slate-400">Selected for trash</div>
              <div className="font-bold text-accent">
                {formatBytes(totalSelectedBytes)}
              </div>
            </div>
          )}

          <button
            onClick={() => onPreviewCleanup(Array.from(selectedPaths))}
            disabled={selectedPaths.size === 0 || isExecuting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-all shadow-md disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={14} />
            <span>Review & Clean ({selectedPaths.size})</span>
          </button>
        </div>
      </div>

      {/* Execution Report Notification (if just executed) */}
      {cleanupReport && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-500" />
            <div>
              <span className="font-semibold">Cleanup Succeeded: </span>
              <span>
                {formatBytes(cleanupReport.bytes_freed)} safely moved to macOS
                Trash ({cleanupReport.succeeded_count} items).
              </span>
            </div>
          </div>
          {cleanupReport.failed_count > 0 && (
            <div className="text-amber-500 font-medium">
              {cleanupReport.failed_count} items skipped due to permissions.
            </div>
          )}
        </div>
      )}

      {/* Categories & Items List */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark text-xs">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium hover:text-accent"
          >
            {selectedPaths.size === cleanupItems.length && cleanupItems.length > 0 ? (
              <CheckSquare size={16} className="text-accent" />
            ) : (
              <Square size={16} className="text-slate-400" />
            )}
            <span>Select All Cleanup Categories</span>
          </button>

          <span className="text-slate-400">
            {cleanupItems.length} candidate locations discovered
          </span>
        </div>

        {cleanupItems.length > 0 ? (
          <div className="divide-y divide-border-light dark:divide-border-dark text-xs">
            {cleanupItems.map((item, idx) => {
              const isSelected = selectedPaths.has(item.path);
              return (
                <div
                  key={idx}
                  className="py-3.5 flex items-center justify-between group hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start gap-3 truncate max-w-xl">
                    <button
                      onClick={() => toggleSelect(item.path)}
                      className="mt-0.5 text-slate-400 hover:text-accent"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-accent" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.category_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.description}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-1">
                        {item.path}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-100">
                        {formatBytes(item.size_bytes)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.file_count.toLocaleString()} files
                      </div>
                    </div>
                    <button
                      onClick={() => onRevealInFinder(item.path)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-accent transition-opacity p-1.5"
                      title="Reveal in Finder"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Sparkles size={24} className="text-slate-300 dark:text-slate-600" />
            <div>No cleanup items identified. Run a scan from Overview or Disk Analyzer.</div>
          </div>
        )}
      </div>
    </div>
  );
};
