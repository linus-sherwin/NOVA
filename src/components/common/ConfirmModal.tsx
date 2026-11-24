import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { CleanupPreview } from "../../types/cleanup";
import { formatBytes } from "../../utils/formatters";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  preview?: CleanupPreview | null;
  singlePath?: string;
  singleSize?: number;
  isExecuting?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  preview,
  singlePath,
  singleSize = 0,
  isExecuting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-800 dark:text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="text-[11px] text-slate-400">
                Selected items will be safely moved to macOS Trash.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Itemized List or Single Item Info */}
        <div className="flex flex-col gap-2">
          {preview && (
            <div className="flex items-center justify-between text-xs px-2 py-1.5 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-lg">
              <span className="text-slate-500">Total Items:</span>
              <span className="font-semibold">{preview.total_count} files</span>
              <span className="text-slate-500 ml-4">Total Space:</span>
              <span className="font-semibold text-accent">
                {formatBytes(preview.total_size_bytes)}
              </span>
            </div>
          )}

          {singlePath && (
            <div className="text-xs p-3 bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark rounded-lg break-all">
              <div className="font-medium text-slate-700 dark:text-slate-200">
                {singlePath}
              </div>
              <div className="text-[11px] text-accent font-semibold mt-1">
                {formatBytes(singleSize)}
              </div>
            </div>
          )}

          {preview && (
            <div className="max-h-48 overflow-y-auto border border-border-light dark:border-border-dark rounded-lg divide-y divide-border-light dark:divide-border-dark text-xs">
              {preview.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <div className="truncate max-w-xs">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {item.path}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatBytes(item.size_bytes)}
                    </span>
                    {item.warning && (
                      <div className="text-[10px] text-amber-500">
                        {item.warning}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-light dark:border-border-dark">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-border-light dark:border-border-dark hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span>{isExecuting ? "Moving to Trash..." : "Move to Trash"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

