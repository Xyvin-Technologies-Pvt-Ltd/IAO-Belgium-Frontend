import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useGetBatchesByIntake } from "@/store/useIntakeStore";
import StatusBadge from "@/components/StatusBadge";

const BatchList = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch } = useGetBatchesByIntake(id, {
    page: page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const batches = data?.data || [];
  const totalRows = data?.total_count || 0;
  const handleRowClick = (batchId) => {
    navigate({
      to: "/admin/admission-administration/academics/intakes/batch/$id",
      params: { id: batchId },
    });
  };
  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("batchManagement.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("batchManagement.table.batchId")}</TableHead>
            <TableHead>{t("batchManagement.table.batchName")}</TableHead>
            <TableHead>{t("batchManagement.table.capacity")}</TableHead>
            <TableHead>{t("batchManagement.table.enrolled")}</TableHead>
            <TableHead>{t("batchManagement.table.available")}</TableHead>
            <TableHead>{t("batchManagement.table.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("batchManagement.messages.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : batches?.length > 0 ? (
            batches?.map((i) => (
              <TableRow
                key={i._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(i._id)}
              >
                <TableCell>{i?.uid}</TableCell>
                <TableCell>{i?.name}</TableCell>
                <TableCell>{i?.intake?.student_per_batch}</TableCell>
                <TableCell>{i?.student_count}</TableCell>
                <TableCell>
                  {i?.intake?.student_per_batch - i?.student_count}
                </TableCell>
                <TableCell>
                  <StatusBadge status={i?.status} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("batchManagement.table.noBatches")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
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

export default BatchList;
