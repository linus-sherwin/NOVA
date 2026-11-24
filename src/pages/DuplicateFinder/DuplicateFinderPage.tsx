import React, { useState } from "react";
import {
  Copy,
  Trash2,
  ExternalLink,
  Play,
  Square,
  CheckCircle2,
} from "lucide-react";
import { DuplicateScanReport } from "../../types/duplicates";
import { formatBytes, formatDate } from "../../utils/formatters";

interface DuplicateFinderPageProps {
  report?: DuplicateScanReport | null;
  isScanning: boolean;
  onScanDuplicates: (path: string, minSizeMb: number) => void;
  onCancelScan: () => void;
  onRevealInFinder: (path: string) => void;
  onRequestTrash: (paths: string[], totalSize: number) => void;
  defaultScanPath?: string;
}

export const DuplicateFinderPage: React.FC<DuplicateFinderPageProps> = ({
  report,
  isScanning,
  onScanDuplicates,
  onCancelScan,
  onRevealInFinder,
  onRequestTrash,
  defaultScanPath = "/Users",
}) => {
  const [scanPath, setScanPath] = useState(defaultScanPath);
  const [minSizeMb, setMinSizeMb] = useState<number>(5);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const handleSelectAutoRecommend = () => {
    if (!report) return;
    const paths = new Set<string>();
    for (const group of report.groups) {
      for (const file of group.files) {
        if (!file.is_recommended_to_keep) {
          paths.add(file.path);
        }
      }
    }
    setSelectedPaths(paths);
  };

  const toggleSelect = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    setSelectedPaths(next);
  };

  const selectedTotalBytes =
    report?.groups.reduce((acc, g) => {
      const selectedInGroup = g.files.filter((f) => selectedPaths.has(f.path));
      return acc + selectedInGroup.length * g.file_size_bytes;
    }, 0) || 0;

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-150">
      {/* Header & Controls */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Copy size={18} className="text-accent" />
            <span>Cryptographic Duplicate Finder</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Uses a 3-stage detection pipeline: Size filtering &rarr; 4KB header
            check &rarr; Full BLAKE3 cryptographic hash verification. Never false
            positives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {report && report.groups.length > 0 && (
            <button
              onClick={handleSelectAutoRecommend}
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-border-light dark:border-border-dark hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark text-slate-700 dark:text-slate-300 transition-colors"
            >
              Select All Duplicates (Keep Originals)
            </button>
          )}

          {selectedPaths.size > 0 && (
            <button
              onClick={() =>
                onRequestTrash(Array.from(selectedPaths), selectedTotalBytes)
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
            >
              <Trash2 size={14} />
              <span>
                Trash Selected ({formatBytes(selectedTotalBytes)})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Scan Config Bar */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-slate-400 font-medium">Scan Target:</span>
          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border-none text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-medium">Min Size:</span>
          <select
            value={minSizeMb}
            onChange={(e) => setMinSizeMb(Number(e.target.value))}
            className="bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border-none rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value={1}>&gt; 1 MB</option>
            <option value={5}>&gt; 5 MB</option>
            <option value={10}>&gt; 10 MB</option>
            <option value={50}>&gt; 50 MB</option>
          </select>

          {isScanning ? (
            <button
              onClick={onCancelScan}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20"
            >
              <Square size={13} className="fill-current" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={() => onScanDuplicates(scanPath, minSizeMb)}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-semibold bg-accent hover:bg-accent-hover text-white transition-colors"
            >
              <Play size={13} className="fill-current" />
              <span>Find Duplicates</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Groups */}
      {report && report.groups.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Found {report.total_groups} duplicate groups (
              {report.total_duplicate_files} duplicate files)
            </span>
            <span className="font-semibold text-accent">
              {formatBytes(report.total_reclaimable_bytes)} recoverable space
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {report.groups.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-subtle flex flex-col gap-3"
              >
                {/* Group Summary Row */}
                <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {group.files[0]?.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                      {group.copies_count} copies
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">
                      Each: {formatBytes(group.file_size_bytes)}
                    </span>
                    <span className="font-bold text-amber-500">
                      Wasted: {formatBytes(group.total_wasted_bytes)}
                    </span>
                  </div>
                </div>

                {/* Copies List */}
                <div className="divide-y divide-border-light dark:divide-border-dark text-xs">
                  {group.files.map((file, fIdx) => {
                    const isSelected = selectedPaths.has(file.path);
                    return (
                      <div
                        key={fIdx}
                        className="py-2.5 flex items-center justify-between group hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/40 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate max-w-xl">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(file.path)}
                            className="rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                {file.path}
                              </span>
                              {file.is_recommended_to_keep && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                                  Keep (Original)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Modified: {formatDate(file.modified_timestamp)}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onRevealInFinder(file.path)}
                          title="Reveal in Finder"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-accent p-1 transition-opacity"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : report ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl">
          <CheckCircle2
            size={28}
            className="text-emerald-500 mx-auto mb-2"
          />
          No duplicate files found matching criteria.
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl">
          Enter a folder path and click Find Duplicates to start scanning.
        </div>
      )}
    </div>
  );
};
