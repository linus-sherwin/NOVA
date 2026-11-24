import React, { useState } from "react";
import {
  Files,
  ExternalLink,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Search,
  Eye,
} from "lucide-react";
import { LargeFileInfo } from "../../types/scan";
import { formatBytes, formatDate, getCategoryColor } from "../../utils/formatters";

interface LargeFilesPageProps {
  largeFiles: LargeFileInfo[];
  onRevealInFinder: (path: string) => void;
  onOpenFile: (path: string) => void;
  onRequestTrash: (paths: string[], totalSize: number) => void;
}

type SizeThreshold = 100 | 500 | 1000 | 5000;

export const LargeFilesPage: React.FC<LargeFilesPageProps> = ({
  largeFiles,
  onRevealInFinder,
  onOpenFile,
  onRequestTrash,
}) => {
  const [minSizeMb, setMinSizeMb] = useState<SizeThreshold>(100);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  // Filter large files
  const filteredFiles = largeFiles.filter((file) => {
    const sizeMb = file.size_bytes / (1024 * 1024);
    if (sizeMb < minSizeMb) return false;
    if (categoryFilter !== "ALL" && file.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

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
    if (selectedPaths.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(filteredFiles.map((f) => f.path)));
    }
  };

  const selectedTotalBytes = filteredFiles
    .filter((f) => selectedPaths.has(f.path))
    .reduce((acc, curr) => acc + curr.size_bytes, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-150">
      {/* Top Banner and Controls */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Files size={18} className="text-accent" />
            <span>Large File Discovery</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Locate massive forgotten video files, disk images, installers, and
            archives occupying disproportionate storage on your Mac.
          </p>
        </div>

        {/* Action Button */}
        {selectedPaths.size > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="text-slate-400">{selectedPaths.size} files</div>
              <div className="font-bold text-accent">
                {formatBytes(selectedTotalBytes)}
              </div>
            </div>
            <button
              onClick={() =>
                onRequestTrash(Array.from(selectedPaths), selectedTotalBytes)
              }
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md"
            >
              <Trash2 size={14} />
              <span>Move Selected to Trash</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 rounded-xl shadow-subtle flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Size Threshold Pills */}
        <div className="flex items-center gap-1 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark p-1 rounded-lg">
          {([100, 500, 1000, 5000] as SizeThreshold[]).map((threshold) => (
            <button
              key={threshold}
              onClick={() => setMinSizeMb(threshold)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                minSizeMb === threshold
                  ? "bg-accent text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              {threshold >= 1000
                ? `>${threshold / 1000} GB`
                : `>${threshold} MB`}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border-none rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Video">Videos</option>
            <option value="Archive">Archives & Disk Images</option>
            <option value="Audio">Audio</option>
            <option value="Document">Documents</option>
            <option value="Image">Images</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search large files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 rounded-lg bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark text-xs border-none text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Large Files Table */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark text-xs font-semibold text-slate-400 px-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="hover:text-slate-600 dark:hover:text-slate-200"
            >
              {selectedPaths.size === filteredFiles.length &&
              filteredFiles.length > 0 ? (
                <CheckSquare size={16} className="text-accent" />
              ) : (
                <Square size={16} />
              )}
            </button>
            <span>File Name ({filteredFiles.length})</span>
          </div>
          <div className="flex items-center gap-8">
            <span>Category</span>
            <span>Modified</span>
            <span>Size</span>
            <span className="w-16 text-right">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-border-light dark:divide-border-dark overflow-y-auto max-h-[480px] text-xs">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, idx) => {
              const isSelected = selectedPaths.has(file.path);
              return (
                <div
                  key={idx}
                  className="py-3 px-2 flex items-center justify-between hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/40 rounded-xl group transition-colors"
                >
                  <div className="flex items-center gap-3 truncate max-w-md">
                    <button
                      onClick={() => toggleSelect(file.path)}
                      className="text-slate-400 hover:text-accent"
                    >
                      {isSelected ? (
                        <CheckSquare size={16} className="text-accent" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {file.parent_dir}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 text-right">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
                      style={{
                        backgroundColor: getCategoryColor(file.category),
                      }}
                    >
                      {file.category}
                    </span>
                    <span className="text-slate-400 text-[11px] w-24 text-right">
                      {formatDate(file.modified_timestamp)}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 w-20 text-right">
                      {formatBytes(file.size_bytes)}
                    </span>

                    <div className="flex items-center gap-1 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onOpenFile(file.path)}
                        title="Open file"
                        className="p-1 rounded text-slate-400 hover:text-accent"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onRevealInFinder(file.path)}
                        title="Reveal in Finder"
                        className="p-1 rounded text-slate-400 hover:text-accent"
                      >
                        <ExternalLink size={14} />
                      </button>
                      <button
                        onClick={() =>
                          onRequestTrash([file.path], file.size_bytes)
                        }
                        title="Move to Trash"
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No files found exceeding {minSizeMb} MB with current filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
