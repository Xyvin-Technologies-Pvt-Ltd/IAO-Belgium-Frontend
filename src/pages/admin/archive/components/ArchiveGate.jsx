import { Archive, AlertTriangle } from "lucide-react";
import { useArchiveStatus } from "@/store/useArchiveStore";
import LoadingState from "@/components/common/LoadingState";

//* Wraps every archive page. The snapshot file is a large (multi-GB) artifact
//* shipped separately from the app (see backend docs/COACHVIEW_MIGRATION.md
//* "Deployment") — a dev machine or a fresh environment without it should show
//* a clear explanation, not a raw failed-request screen on every page.
const ArchiveGate = ({ children }) => {
  const { data, isLoading } = useArchiveStatus();

  if (isLoading) {
    return <LoadingState text="Checking archive availability..." fullHeight />;
  }

  if (data?.data && !data.data.available) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-sidebar-border bg-sidebar p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <h3 className="text-base font-semibold text-dashboard-text dark:text-white">
          CoachView archive not available on this server
        </h3>
        <p className="max-w-md text-sm text-gray-500 dark:text-white/60">
          {data.data.reason ||
            "The frozen CoachView snapshot has not been configured. Set COACHVIEW_ARCHIVE_DB and restart the backend."}
        </p>
      </div>
    );
  }

  return children;
};

export const ArchiveIcon = Archive;
export default ArchiveGate;
