import React, { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetBatchAttendance } from "@/store/useBatchStore";
import { Check, X } from "lucide-react";
import { formatTZ } from "@/utils/dateUtils";

const BatchAttendence = () => {
  const params = useParams({ strict: false });
  const batchId = params.id;
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetBatchAttendance(
    batchId,
    {
      page: page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
    },
  );

  const modules = data?.data?.modules || [];
  const students = data?.data?.students || [];
  const totalRows = data?.total_count || 0;

  const getAttendanceIcon = (status) => {
    if (status === "present") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-2 h-2 text-white stroke-3" />
          </div>
        </div>
      );
    } else if (status === "absent") {
      return (
        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-2 h-2 text-white stroke-3" />
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


  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("batchManagement.searchStudent")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="sticky left-0 bg-muted/50 z-10 w-45 border-r">
                {t("batchManagement.table.student")}
              </TableHead>
              {modules.map((module) => (
                <TableHead
                  key={module.module_id}
                  colSpan={Math.max(1, module.sessions.length)}
                  className="text-center border-l bg-muted/50"
                >
                  <div className="font-semibold text-sm">
                    {module.module_name}
                  </div>
                </TableHead>
              ))}
            </TableRow>
            <TableRow className="bg-muted/30">
              <TableHead className="sticky left-0 bg-muted/30 z-10 border-r"></TableHead>
              {modules.map((module) =>
                module.sessions.length > 0 ? (
                  module.sessions.map((session) => (
                    <TableHead
                      key={String(session.session_id)}
                      className="text-center min-w-17.5 border-l px-2"
                    >
                      <div className="text-xs font-normal">
                        {formatTZ(session.session_date, "D MMM")}
                      </div>
                    </TableHead>
                  ))
                ) : (
                  <TableHead
                    key={`${module.module_id}-no-session`}
                    className="text-center min-w-17.5 border-l px-2"
                  >
                    <div className="text-xs font-normal text-muted-foreground italic">
                      -
                    </div>
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton
                rows={rowsPerPage}
                columns={
                  1 + modules.reduce((acc, m) => acc + Math.max(1, m.sessions.length), 0)
                }
              />
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={
                    1 + modules.reduce((acc, m) => acc + Math.max(1, m.sessions.length), 0)
                  }
                  className="text-center p-8"
                >
                  <ErrorMessage
                    message={
                      error?.message || t("batchManagement.messages.loadFailed")
                    }
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : students?.length > 0 ? (
              students.map((student) => (
                <TableRow key={student._id} className="hover:bg-muted/30">
                  <TableCell className="sticky left-0 z-10 border-r w-45 truncate">
                    {student.student_name}
                  </TableCell>
                  {modules.map((module) =>
                    module.sessions.length > 0 ? (
                      module.sessions.map((session) => {
                        const sid = String(session.session_id);
                        const attendance = student.attendance?.[sid];
                        return (
                          <TableCell
                            key={sid}
                            className="text-center border-l py-2"
                          >
                            {getAttendanceIcon(attendance)}
                          </TableCell>
                        );
                      })
                    ) : (
                      <TableCell
                        key={`${module.module_id}-no-session`}
                        className="text-center border-l py-2 text-muted-foreground italic"
                      >
                        -
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    1 + modules.reduce((acc, m) => acc + Math.max(1, m.sessions.length), 0)
                  }
                  className="text-center"
                >
                  {t("batchManagement.table.noStudents")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />
    </div>
  );
};

export default BatchAttendence;
