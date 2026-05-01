import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetStudentsContracts } from "@/store/useContractStore";
import { useTranslation } from "react-i18next";
import moment from "moment";

const StudentContracts = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const { data, isLoading, error, refetch, isFetching } =
    useGetStudentsContracts({
      page,
      limit: rowsPerPage,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(status ? { status } : {}),
    });

  const contracts = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={t("common.searchStudentNameEmail")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={status}
          onValueChange={(val) => {
            setStatus(val === "all" ? "" : val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue
              placeholder={t("common.chooseStatus") || t("common.allStatuses")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("common.pending")}</SelectItem>
            <SelectItem value="signed">{t("common.signed")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.student")}</TableHead>
            <TableHead>{t("common.email")}</TableHead>
            <TableHead>{t("common.contract")}</TableHead>
            <TableHead>{t("common.version")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.signedAt")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={isFetching ? "opacity-50 pointer-events-none" : ""}
        >
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("common.failedToLoadStudentContracts")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : contracts.length > 0 ? (
            contracts.map((item) => (
              <TableRow key={item._id}>
                <TableCell className={"capitalize"}>
                  {item.application?.user?.last_name}{" "}
                  {item.application?.user?.first_name}
                </TableCell>
                <TableCell>{item.application?.user?.email}</TableCell>
                <TableCell>{item.contract?.name ?? "—"}</TableCell>
                <TableCell>
                  {item.contract?.version ? `v${item.contract.version}` : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      item.status === "signed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status === "signed"
                      ? t("common.signed")
                      : t("common.pending")}
                  </span>
                </TableCell>
                <TableCell>
                  {item.signed_at ? (
                    moment(item.signed_at).format("DD-MM-YYYY")
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {t("common.noStudentContracts")}
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

export default StudentContracts;
