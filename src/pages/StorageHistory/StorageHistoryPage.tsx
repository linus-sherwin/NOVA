import React from "react";
import { History, TrendingUp, Calendar } from "lucide-react";
import { ScanRecord, StorageTrendPoint } from "../../types/storage";
import { StorageHistoryChart } from "../../components/charts/StorageHistoryChart";
import { formatBytes, formatDuration } from "../../utils/formatters";

interface StorageHistoryPageProps {
  scanRecords: ScanRecord[];
  trendPoints: StorageTrendPoint[];
  onRescanTarget: (path: string) => void;
}

export const StorageHistoryPage: React.FC<StorageHistoryPageProps> = ({
  scanRecords,
  trendPoints,
  onRescanTarget,
}) => {
  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-6 select-none animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <History size={18} className="text-accent" />
            <span>Storage Intelligence & History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Track filesystem growth and capacity changes over time. All records
            are securely stored in your local SQLite database.
          </p>
        </div>
      </div>

      {/* Historical Storage Trend Chart */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-6 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            <TrendingUp size={15} className="text-accent" />
            <span>Disk Consumption Trends</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-slate-500">Used Space</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Free Space</span>
            </div>
          </div>
        </div>

        <StorageHistoryChart data={trendPoints} />
      </div>

      {/* Historical Scans Table */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-5 shadow-subtle flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark text-xs font-semibold text-slate-400 px-2">
          <span>Scan Date & Target</span>
          <div className="flex items-center gap-12">
            <span>Duration</span>
            <span>Items Processed</span>
            <span>Scanned Size</span>
            <span className="w-16 text-right">Action</span>
          </div>
        </div>

        <div className="divide-y divide-border-light dark:divide-border-dark overflow-y-auto max-h-[360px] text-xs">
          {scanRecords.length > 0 ? (
            scanRecords.map((record) => {
              const formattedDate = new Date(record.scanned_at).toLocaleString(
                undefined,
                {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              return (
                <div
                  key={record.id}
                  className="py-3 px-2 flex items-center justify-between hover:bg-surfaceSubtle-light dark:hover:bg-surfaceSubtle-dark/40 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 truncate max-w-sm">
                    <div className="w-7 h-7 rounded-lg bg-surfaceSubtle-light dark:bg-surfaceSubtle-dark flex items-center justify-center text-slate-500">
                      <Calendar size={14} />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {record.target_path}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 text-right">
                    <span className="text-slate-400 w-16 text-right">
                      {formatDuration(record.elapsed_secs)}
                    </span>
                    <span className="text-slate-500 w-24 text-right">
                      {record.file_count.toLocaleString()} files
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 w-20 text-right">
                      {formatBytes(record.total_bytes)}
                    </span>

                    <button
                      onClick={() => onRescanTarget(record.target_path)}
                      className="text-xs text-accent hover:underline font-medium w-16 text-right"
                    >
                      Rescan
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              No previous scan logs recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
