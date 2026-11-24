import React from "react";
import { ScanProgress } from "../../types/scan";
import { formatBytes, formatDuration } from "../../utils/formatters";

interface ScanProgressBarProps {
  progress: ScanProgress;
}

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  progress,
}) => {
  return (
    <div className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-2.5 flex items-center justify-between text-xs select-none shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center gap-4 truncate max-w-xl">
        <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
        <div className="truncate">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span>Analyzing filesystem...</span>
            <span className="text-[11px] font-normal text-slate-400">
              ({progress.files_scanned.toLocaleString()} files,{" "}
              {progress.directories_scanned.toLocaleString()} folders)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate max-w-md">
            {progress.current_directory}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 text-right font-medium">
        <div>
          <div className="text-slate-400 text-[10px] uppercase">Scanned</div>
          <div className="text-slate-800 dark:text-slate-200">
            {formatBytes(progress.total_bytes)}
          </div>
        </div>
        <div className="border-l border-border-light dark:border-border-dark pl-4">
          <div className="text-slate-400 text-[10px] uppercase">Elapsed</div>
          <div className="text-slate-800 dark:text-slate-200">
            {formatDuration(progress.elapsed_secs)}
          </div>
        </div>
      </div>
    </div>
  );
};

