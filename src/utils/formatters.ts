import { FileCategory } from "../types/scan";

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0) return `${bytes} B`;
  const index = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, index)).toFixed(dm))} ${sizes[index]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

export function formatDate(timestampSecs?: number): string {
  if (!timestampSecs) return "Unknown";
  const date = new Date(timestampSecs * 1000);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getCategoryColor(category: FileCategory | string): string {
  switch (category) {
    case "Video":
      return "#8B5CF6"; // Purple
    case "Image":
      return "#3B82F6"; // Blue
    case "Audio":
      return "#EC4899"; // Pink
    case "Archive":
      return "#F59E0B"; // Amber
    case "Document":
      return "#10B981"; // Emerald
    case "Application":
      return "#06B6D4"; // Cyan
    case "Code":
      return "#6366F1"; // Indigo
    case "Cache":
      return "#F97316"; // Orange
    case "Log":
      return "#64748B"; // Slate
    default:
      return "#94A3B8"; // Slate subtle
  }
}

