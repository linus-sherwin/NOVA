import React, { useState } from "react";
import {
  PieChart as SunburstIcon,
  Grid as TreemapIcon,
  List as ListIcon,
  Folder,
  File,
  ExternalLink,
  Trash2,
  ChevronRight,
  Search,
} from "lucide-react";
import { TreeNode, ScanResult } from "../../types/scan";
import { SunburstChart } from "../../components/charts/SunburstChart";
import { TreemapChart } from "../../components/charts/TreemapChart";
import { formatBytes } from "../../utils/formatters";

interface DiskAnalyzerPageProps {
  scanResult?: ScanResult | null;
  onRevealInFinder: (path: string) => void;
  onRequestTrash: (path: string, size: number) => void;
  onStartScan: (path: string) => void;
}

type ViewMode = "sunburst" | "treemap" | "list";
type SortOption = "size_desc" | "size_asc" | "name" | "type";

export const DiskAnalyzerPage: React.FC<DiskAnalyzerPageProps> = ({
  scanResult,
  onRevealInFinder,
  onRequestTrash,
  onStartScan,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("sunburst");
  const [currentNode, setCurrentNode] = useState<TreeNode | null>(
    scanResult ? scanResult.root_node : null,
  );
  const [searchFilter, setSearchFilter] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("size_desc");

  // Keep currentNode synchronized with latest scanResult
  React.useEffect(() => {
    if (scanResult) {
      setCurrentNode(scanResult.root_node);
    }
  }, [scanResult]);

  if (!scanResult || !currentNode) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
          <SunburstIcon size={32} />
        </div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
          No Filesystem Scanned Yet
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
          Scan your home directory or select a custom folder to visualize disk
          usage with interactive Sunburst and Treemap charts.
        </p>
        <button
          onClick={() => onStartScan("/")}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium text-xs shadow-md hover:bg-accent-hover transition-colors"
        >
          Scan Macintosh HD
        </button>
      </div>
    );
  }

  // Filter and sort children for list view
  const displayChildren = (currentNode.children || [])
    .filter((child) =>
      child.name.toLowerCase().includes(searchFilter.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortOption) {
        case "size_asc":
          return Number(a.size_bytes) - Number(b.size_bytes);
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return (a.category || "").localeCompare(b.category || "");
        case "size_desc":
        default:
          return Number(b.size_bytes) - Number(a.size_bytes);
      }
    });

  // Build breadcrumb segments from current path
  const pathSegments = currentNode.path.split("/").filter(Boolean);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-5 select-none animate-in fade-in duration-150">
      {/* Top Bar: Breadcrumb & View Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-3.5 rounded-2xl shadow-subtle">
        {/* Breadcrumb Trail */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto py-1 max-w-2xl">
          <button
            onClick={() => setCurrentNode(scanResult.root_node)}
            className="text-slate-500 hover:text-accent font-medium truncate"
          >
            {scanResult.root_node.name}
          </button>
          {pathSegments.map((segment, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={12} className="text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode("sunburst")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "sunburst"
                ? "bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <SunburstIcon size={14} />
            <span>Sunburst</span>
          </button>
          <button
            onClick={() => setViewMode("treemap")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "treemap"
                ? "bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <TreemapIcon size={14} />
            <span>Treemap</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <ListIcon size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Center Visualizer (Takes 7 cols on desktop when sunburst/treemap) */}
        <div
          className={`${
            viewMode === "list" ? "hidden" : "lg:col-span-7"
          } bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-subtle flex flex-col items-center justify-center min-h-[560px]`}
        >
          {viewMode === "sunburst" ? (
            <SunburstChart
              data={currentNode}
              onSelectNode={(node) => setCurrentNode(node)}
              onRevealInFinder={onRevealInFinder}
            />
          ) : (
            <TreemapChart
              data={currentNode}
              onSelectNode={(node) => setCurrentNode(node)}
              onRevealInFinder={onRevealInFinder}
            />
          )}
        </div>

        {/* Right Side / Full Width Directory Inspector Table */}
        <div
          className={`${
            viewMode === "list" ? "lg:col-span-12" : "lg:col-span-5"
          } bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-subtle flex flex-col`}
        >
          {/* Table Header Controls */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-border-light dark:border-border-dark mb-3">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-2.5 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark border-none focus:outline-none focus:ring-1 focus:ring-accent text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-xs bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark px-2.5 py-1.5 rounded-lg border-none text-slate-600 dark:text-slate-300 focus:outline-none"
            >
              <option value="size_desc">Largest First</option>
              <option value="size_asc">Smallest First</option>
              <option value="name">Name</option>
              <option value="type">File Type</option>
            </select>
          </div>

          {/* Directory Children List */}
          <div className="overflow-y-auto max-h-[500px] divide-y divide-border-light dark:divide-border-dark text-xs">
            {displayChildren.length > 0 ? (
              displayChildren.map((child, idx) => (
                <div
                  key={idx}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/50 rounded-lg group transition-colors"
                >
                  <div
                    onClick={() => {
                      if (child.is_dir) {
                        setCurrentNode(child);
                      }
                    }}
                    className={`flex items-center gap-2.5 truncate max-w-[220px] ${
                      child.is_dir ? "cursor-pointer" : ""
                    }`}
                  >
                    {child.is_dir ? (
                      <Folder size={16} className="text-accent shrink-0" />
                    ) : (
                      <File size={16} className="text-slate-400 shrink-0" />
                    )}
                    <div className="truncate">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-accent">
                        {child.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {child.is_dir
                          ? `${child.file_count || 0} items`
                          : child.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatBytes(Number(child.size_bytes))}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRevealInFinder(child.path)}
                        title="Reveal in Finder"
                        className="p-1 rounded text-slate-400 hover:text-accent"
                      >
                        <ExternalLink size={13} />
                      </button>
                      <button
                        onClick={() =>
                          onRequestTrash(child.path, Number(child.size_bytes))
                        }
                        title="Move to Trash"
                        className="p-1 rounded text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No items match the filter in this folder.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
