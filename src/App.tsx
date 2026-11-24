import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { ScanProgressBar } from "./components/layout/ScanProgressBar";
import { ConfirmModal } from "./components/common/ConfirmModal";

import { OverviewPage } from "./pages/Overview/OverviewPage";
import { DiskAnalyzerPage } from "./pages/DiskAnalyzer/DiskAnalyzerPage";
import { CleanupPage } from "./pages/Cleanup/CleanupPage";
import { LargeFilesPage } from "./pages/LargeFiles/LargeFilesPage";
import { DuplicateFinderPage } from "./pages/DuplicateFinder/DuplicateFinderPage";
import { ApplicationsPage } from "./pages/Applications/ApplicationsPage";
import { StorageHistoryPage } from "./pages/StorageHistory/StorageHistoryPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";

import { api } from "./services/api";
import { QuickScanTarget, ScanProgress, ScanResult } from "./types/scan";
import {
  PermissionStatus,
  ScanRecord,
  StorageTrendPoint,
  SystemStorageOverview,
} from "./types/storage";
import { CleanupPreview, CleanupReport } from "./types/cleanup";
import { DuplicateScanReport } from "./types/duplicates";
import { InstalledApp } from "./types/applications";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("dark");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Storage & Permissions
  const [storageOverview, setStorageOverview] =
    useState<SystemStorageOverview>();
  const [quickTargets, setQuickTargets] = useState<QuickScanTarget[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>();

  // Active Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Duplicates State
  const [isDuplicateScanning, setIsDuplicateScanning] = useState(false);
  const [duplicateReport, setDuplicateReport] =
    useState<DuplicateScanReport | null>(null);

  // Applications State
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);

  // History State
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);
  const [trendPoints, setTrendPoints] = useState<StorageTrendPoint[]>([]);

  // Deletion Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingTrashPaths, setPendingTrashPaths] = useState<string[]>([]);
  const [deletionPreview, setDeletionPreview] =
    useState<CleanupPreview | null>(null);
  const [cleanupReport, setCleanupReport] = useState<CleanupReport | null>(
    null,
  );
  const [isExecutingTrash, setIsExecutingTrash] = useState(false);
  const [defaultScanPath, setDefaultScanPath] = useState("/");

  // Theme synchronization
  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [storage, targets, perms, history, trends] =
          await Promise.allSettled([
            api.getSystemStorage(),
            api.getQuickTargets(),
            api.checkPermissions(),
            api.getScanHistory(),
            api.getStorageTrends(),
          ]);

        if (storage.status === "fulfilled") setStorageOverview(storage.value);
        if (targets.status === "fulfilled") setQuickTargets(targets.value);
        if (perms.status === "fulfilled") setPermissionStatus(perms.value);
        if (history.status === "fulfilled") setScanRecords(history.value);
        if (trends.status === "fulfilled") setTrendPoints(trends.value);
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    loadInitialData();
  }, []);

  // Listen to Tauri progress events
  useEffect(() => {
    let unlistenProgress: (() => void) | undefined;
    let unlistenComplete: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenProgress = await listen<ScanProgress>("scan:progress", (event) => {
        setScanProgress(event.payload);
      });

      unlistenComplete = await listen<ScanResult>("scan:complete", (event) => {
        setScanResult(event.payload);
        setIsScanning(false);
        setScanProgress(null);
        // Refresh history
        api.getScanHistory().then(setScanRecords).catch(console.error);
        api.getStorageTrends().then(setTrendPoints).catch(console.error);
      });
    };

    setupListeners();

    return () => {
      unlistenProgress?.();
      unlistenComplete?.();
    };
  }, []);

  // Start filesystem scan
  const handleStartScan = async (path: string) => {
    setIsScanning(true);
    setScanProgress({
      files_scanned: 0,
      directories_scanned: 0,
      total_bytes: 0,
      current_directory: path,
      elapsed_secs: 0,
      is_cancelled: false,
    });

    try {
      const result = await api.startScan(path, 100);
      setScanResult(result);
    } catch (err) {
      console.error("Scan error:", err);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  const handleCancelScan = async () => {
    try {
      await api.cancelScan();
    } catch (err) {
      console.error("Cancel scan error:", err);
    }
  };

  // Find duplicates
  const handleScanDuplicates = async (path: string, minSizeMb: number) => {
    setIsDuplicateScanning(true);
    try {
      const report = await api.findDuplicates(path, minSizeMb);
      setDuplicateReport(report);
    } catch (err) {
      console.error("Duplicate scan error:", err);
    } finally {
      setIsDuplicateScanning(false);
    }
  };

  // Applications
  const handleRefreshApps = async () => {
    setIsLoadingApps(true);
    try {
      const list = await api.getInstalledApplications();
      setApps(list);
    } catch (err) {
      console.error("App scan error:", err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    if (currentTab === "applications" && apps.length === 0) {
      handleRefreshApps();
    }
  }, [currentTab]);

  // Safe Trash Deletion Workflow
  const handleRequestTrash = async (paths: string[], _totalSize: number) => {
    setPendingTrashPaths(paths);
    try {
      const preview = await api.previewCleanup(paths);
      setDeletionPreview(preview);
      setConfirmModalOpen(true);
    } catch (err) {
      console.error("Failed to preview cleanup:", err);
    }
  };

  const handleConfirmTrash = async () => {
    setIsExecutingTrash(true);
    try {
      const report = await api.executeCleanup(pendingTrashPaths);
      setCleanupReport(report);
      setConfirmModalOpen(false);

      // Refresh system storage
      const storage = await api.getSystemStorage();
      setStorageOverview(storage);

      // Refresh apps if on apps page
      if (currentTab === "applications") {
        handleRefreshApps();
      }
    } catch (err) {
      console.error("Failed to execute cleanup:", err);
    } finally {
      setIsExecutingTrash(false);
    }
  };

  const pageTitles: Record<NavTab, { title: string; subtitle?: string }> = {
    overview: {
      title: "Storage Overview",
      subtitle: "System storage health and quick cleanup opportunities",
    },
    analyzer: {
      title: "Disk Analyzer",
      subtitle: "Interactive Sunburst and Treemap filesystem explorer",
    },
    cleanup: {
      title: "Smart Cleanup",
      subtitle: "Safe user caches, developer artifacts, and temporary data",
    },
    "large-files": {
      title: "Large File Discovery",
      subtitle: "Filter and triage massive forgotten files and disk images",
    },
    duplicates: {
      title: "Duplicate Finder",
      subtitle: "Cryptographic 3-stage duplicate detection",
    },
    applications: {
      title: "Application Manager",
      subtitle: "Installed applications and associated ~/Library support files",
    },
    history: {
      title: "Storage History",
      subtitle: "Historical usage trends and scan records",
    },
    settings: {
      title: "Settings & Safeguards",
      subtitle: "Appearance, permissions, and security invariants",
    },
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        usedBytes={storageOverview?.primary_volume?.used_space_bytes}
        totalBytes={storageOverview?.primary_volume?.total_space_bytes}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          title={pageTitles[currentTab].title}
          subtitle={pageTitles[currentTab].subtitle}
          permissionStatus={permissionStatus}
          isScanning={isScanning}
          onQuickScan={() =>
            handleStartScan(quickTargets[0]?.path || "/Users")
          }
          onCancelScan={handleCancelScan}
          onOpenSettings={() => setCurrentTab("settings")}
        />

        {/* Live Scan Progress Stream Bar */}
        {isScanning && scanProgress && (
          <ScanProgressBar progress={scanProgress} />
        )}

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === "overview" && (
            <OverviewPage
              storageOverview={storageOverview}
              lastScan={scanResult}
              quickTargets={quickTargets}
              onStartScan={handleStartScan}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRevealInFinder={(path) => api.revealInFinder(path)}
            />
          )}

          {currentTab === "analyzer" && (
            <DiskAnalyzerPage
              scanResult={scanResult}
              onRevealInFinder={(path) => api.revealInFinder(path)}
              onRequestTrash={(path, size) => handleRequestTrash([path], size)}
              onStartScan={handleStartScan}
            />
          )}

          {currentTab === "cleanup" && (
            <CleanupPage
              cleanupItems={scanResult?.cleanup_opportunities || []}
              onPreviewCleanup={(paths) => handleRequestTrash(paths, 0)}
              onRevealInFinder={(path) => api.revealInFinder(path)}
              cleanupReport={cleanupReport}
              isExecuting={isExecutingTrash}
            />
          )}

          {currentTab === "large-files" && (
            <LargeFilesPage
              largeFiles={scanResult?.large_files || []}
              onRevealInFinder={(path) => api.revealInFinder(path)}
              onOpenFile={(path) => api.openFile(path)}
              onRequestTrash={handleRequestTrash}
            />
          )}

          {currentTab === "duplicates" && (
            <DuplicateFinderPage
              report={duplicateReport}
              isScanning={isDuplicateScanning}
              onScanDuplicates={handleScanDuplicates}
              onCancelScan={() => api.cancelDuplicateScan()}
              onRevealInFinder={(path) => api.revealInFinder(path)}
              onRequestTrash={handleRequestTrash}
              defaultScanPath={quickTargets[0]?.path || "/Users"}
            />
          )}

          {currentTab === "applications" && (
            <ApplicationsPage
              apps={apps}
              isLoading={isLoadingApps}
              onRefreshApps={handleRefreshApps}
              onRevealInFinder={(path) => api.revealInFinder(path)}
              onRequestUninstall={(app) => {
                const paths = [
                  app.app_path,
                  ...app.associated_files.map((f) => f.path),
                ];
                handleRequestTrash(paths, app.total_footprint_bytes);
              }}
            />
          )}

          {currentTab === "history" && (
            <StorageHistoryPage
              scanRecords={scanRecords}
              trendPoints={trendPoints}
              onRescanTarget={handleStartScan}
            />
          )}

          {currentTab === "settings" && (
            <SettingsPage
              theme={theme}
              onChangeTheme={setTheme}
              permissionStatus={permissionStatus}
              onOpenFullDiskAccess={() => api.openFullDiskAccess()}
              defaultScanPath={defaultScanPath}
              onChangeDefaultPath={setDefaultScanPath}
            />
          )}
        </main>
      </div>

      {/* Itemized Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmTrash}
        title="Confirm Safe Move to Trash"
        preview={deletionPreview}
        isExecuting={isExecutingTrash}
      />
    </div>
  );
};

