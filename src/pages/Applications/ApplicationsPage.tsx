import React, { useState } from "react";
import {
  LayoutGrid,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Package,
} from "lucide-react";
import { InstalledApp } from "../../types/applications";
import { formatBytes } from "../../utils/formatters";

interface ApplicationsPageProps {
  apps: InstalledApp[];
  isLoading: boolean;
  onRefreshApps: () => void;
  onRevealInFinder: (path: string) => void;
  onRequestUninstall: (app: InstalledApp) => void;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({
  apps,
  isLoading,
  onRefreshApps,
  onRevealInFinder,
  onRequestUninstall,
}) => {
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (name: string) => {
    setExpandedApp(expandedApp === name ? null : name);
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.bundle_id &&
        app.bundle_id.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <LayoutGrid size={18} className="text-accent" />
            <span>Application Manager & Leftovers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Inspect all installed macOS applications and their associated data
            stored in Application Support, Caches, Preferences, and Containers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshApps}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 transition-colors border border-border-light dark:border-border-dark"
          >
            {isLoading ? "Scanning..." : "Refresh Applications"}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Filter applications by name or bundle identifier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Applications List */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark text-xs font-semibold text-slate-400 px-3">
          <span>Application ({filteredApps.length})</span>
          <div className="flex items-center gap-10">
            <span>App Size</span>
            <span>Total Footprint</span>
            <span className="w-16 text-right">Actions</span>
          </div>
        </div>

        <div className="divide-y divide-border-light dark:divide-border-dark overflow-y-auto max-h-[500px] text-xs">
          {filteredApps.length > 0 ? (
            filteredApps.map((app, idx) => {
              const isExpanded = expandedApp === app.name;
              return (
                <div key={idx} className="flex flex-col">
                  {/* Main App Row */}
                  <div className="py-3 px-3 flex items-center justify-between hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/40 rounded-xl group transition-colors">
                    <div
                      onClick={() => toggleExpand(app.name)}
                      className="flex items-center gap-3 cursor-pointer truncate max-w-md"
                    >
                      {app.associated_files.length > 0 ? (
                        isExpanded ? (
                          <ChevronDown size={14} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-400" />
                        )
                      ) : (
                        <div className="w-3.5" />
                      )}

                      <div className="w-8 h-8 rounded-lg bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shrink-0">
                        <Package size={16} />
                      </div>

                      <div className="truncate">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>{app.name}</span>
                          {app.version && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              v{app.version}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {app.bundle_id || app.app_path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 text-right">
                      <span className="text-slate-500 w-16 text-right">
                        {formatBytes(app.app_size_bytes)}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 w-20 text-right">
                        {formatBytes(app.total_footprint_bytes)}
                      </span>

                      <div className="flex items-center gap-1 w-16 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onRevealInFinder(app.app_path)}
                          title="Reveal in Finder"
                          className="p-1 rounded text-slate-400 hover:text-accent"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => onRequestUninstall(app)}
                          title="Clean Uninstall"
                          className="p-1 rounded text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Associated Leftovers */}
                  {isExpanded && app.associated_files.length > 0 && (
                    <div className="bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark/40 mx-4 my-1 p-3 rounded-xl flex flex-col gap-2 text-xs border border-border-light dark:border-border-dark">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
                        Associated Support & Cache Files ({app.associated_files.length})
                      </div>
                      {app.associated_files.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between py-1 text-[11px] group/item"
                        >
                          <div className="truncate max-w-lg">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              [{file.file_type}]
                            </span>{" "}
                            <span className="text-slate-400 truncate">
                              {file.path}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {formatBytes(file.size_bytes)}
                            </span>
                            <button
                              onClick={() => onRevealInFinder(file.path)}
                              className="text-[10px] text-accent hover:underline opacity-0 group-item:opacity-100"
                            >
                              Finder
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No applications match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
