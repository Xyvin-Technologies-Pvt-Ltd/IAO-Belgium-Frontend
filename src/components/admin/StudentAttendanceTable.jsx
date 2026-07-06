import React from "react";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import ErrorMessage from "@/components/common/ErrorMessage";

const getAttendanceIcon = (status) => {
  if (status === "present") {
    return (
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-2 h-2 text-white stroke-[3]" />
        </div>
      </div>
    );
  }
  if (status === "absent") {
    return (
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-2 h-2 text-white stroke-[3]" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
    </div>
  );
};

const getAttendanceLabel = (status, t) => {
  if (status === "present") return t("studentManagement.details.attended", "Attended");
  if (status === "absent") return t("studentManagement.details.missed", "Missed");
  return t("studentManagement.details.unmarked", "Unmarked");
};

const StudentAttendanceTable = ({
  modules = [],
  isLoading,
  error,
  refetch,
  isFetching,
  compact = false,
}) => {
  const { t } = useTranslation();

  return (
    <Table className="border-collapse">
      <TableHeader>
        <TableRow className="bg-muted/50 border-b">
          <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-3 px-3 text-left">
            {t("studentManagement.details.moduleId", "Module ID")}
          </TableHead>
          <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-3 px-3 text-left">
            {t("studentManagement.details.moduleName", "Module Name")}
          </TableHead>
          <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-3 px-3 text-left">
            {t("studentManagement.details.sessions", "Sessions")}
          </TableHead>
          {!compact && (
            <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-3 px-3 text-left">
              {t("common.date", "Date")}
            </TableHead>
          )}
          <TableHead className="font-semibold text-foreground uppercase text-[11px] tracking-wider py-3 px-3 text-center">
            {t("studentManagement.details.attendance", "Attendance")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
        {isLoading ? (
          <TableSkeleton rows={compact ? 3 : 5} columns={compact ? 4 : 5} />
        ) : error ? (
          <TableRow>
            <TableCell colSpan={compact ? 4 : 5} className="text-center p-6">
              <ErrorMessage
                message={error?.message || t("studentManagement.details.attendanceLoadFailed", "Failed to load attendance")}
                onRetry={refetch}
                variant="inline"
              />
            </TableCell>
          </TableRow>
        ) : modules.length > 0 ? (
          modules.map((module, mIdx) => (
            <React.Fragment key={mIdx}>
              {module.sessions?.length > 0 ? (
                module.sessions.map((session, sIdx) => (
                  <TableRow
                    key={`${mIdx}-${sIdx}`}
                    className="hover:bg-muted/10 border-b transition-colors"
                  >
                    {sIdx === 0 && (
                      <>
                        <TableCell
                          rowSpan={module.sessions.length}
                          className="align-top py-3 px-3 font-medium text-sm text-foreground/80"
                        >
                          {module.uid}
                        </TableCell>
                        <TableCell
                          rowSpan={module.sessions.length}
                          className="align-top py-3 px-3 font-bold text-sm text-foreground/90 max-w-[200px]"
                        >
                          <div className="leading-tight whitespace-normal break-words">
                            {module.name}
                          </div>
                        </TableCell>
                      </>
                    )}
                    <TableCell className="py-3 px-3 text-sm text-foreground/70 align-middle">
                      {session.name}
                    </TableCell>
                    {!compact && (
                      <TableCell className="py-3 px-3 text-sm text-foreground/70 align-middle">
                        {session.date
                          ? moment(session.date).format("DD-MM-YYYY")
                          : "-"}
                      </TableCell>
                    )}
                    <TableCell className="py-3 px-3 text-center align-middle">
                      <div className="flex flex-col items-center gap-1">
                        {getAttendanceIcon(session.attendance)}
                        {compact && (
                          <span className="text-[10px] text-muted-foreground">
                            {getAttendanceLabel(session.attendance, t)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-muted/10 transition-colors">
                  <TableCell className="py-3 px-3 font-medium text-sm text-foreground/80">
                    {module.uid}
                  </TableCell>
                  <TableCell className="py-3 px-3 font-bold text-sm text-foreground/90">
                    {module.name}
                  </TableCell>
                  <TableCell
                    colSpan={compact ? 1 : 2}
                    className="py-3 px-3 text-sm text-muted-foreground italic"
                  >
                    {t("studentManagement.details.noSessionsPlanned", "No sessions planned")}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    {getAttendanceIcon("pending")}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={compact ? 4 : 5}
              className="text-center p-6 text-muted-foreground italic text-sm"
            >
              {t("studentManagement.details.noAttendanceRecords", "No attendance records found for this year.")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default StudentAttendanceTable;
