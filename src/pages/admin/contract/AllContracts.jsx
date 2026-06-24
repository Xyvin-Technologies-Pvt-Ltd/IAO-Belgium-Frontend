import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetContracts } from "@/store/useContractStore";
import CreateContract from "@/components/admin/contract/CreateContract";
import { useTranslation } from "react-i18next";

const AllContracts = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);
  
  const { data, isLoading, error, refetch, isFetching } = useGetContracts({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const contracts = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleOpenCreate = () => {
    setSelectedContract(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("common.searchContracts")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={handleOpenCreate}>{t("common.createContract")}</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Contract Type</TableHead>
            <TableHead>{t("common.version")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.file") || "File"}</TableHead>
            <TableHead>{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={7} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("common.failedToLoadContracts")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : contracts.length > 0 ? (
            contracts.map((contract) => (
              <TableRow key={contract._id}>
                <TableCell>{contract.name}</TableCell>
                <TableCell>{contract.program?.name || "Global"}</TableCell>
                <TableCell className="capitalize">{contract.contract_type?.replace("_", " ")}</TableCell>
                <TableCell>v{contract.version}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      contract.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {contract.is_active ? t("common.active") : t("common.inactive")}
                  </span>
                </TableCell>
                <TableCell>
                  {contract.file ? (
                    <a
                      href={contract.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      {t("common.view")} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("common.edit"),
                        icon: Edit,
                        onClick: () => handleOpenEdit(contract),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {t("common.noContracts")}
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

      <CreateContract
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contractData={selectedContract}
      />
    </div>
  );
};

export default AllContracts;
