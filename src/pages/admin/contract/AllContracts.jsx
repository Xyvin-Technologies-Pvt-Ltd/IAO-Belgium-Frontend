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
import { openSecureFile } from "@/utils/secureFile";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCanModify } from "@/hooks/useCanModify";

const AllContracts = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("master_data");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const [contractType, setContractType] = useState("");
  const [programType, setProgramType] = useState("");

  const programTypes = [
    "Master of Science",
    "Lateral Entry Master of Science",
    "Diploma",
    "Manual Therapie",
    "Post Academic Module",
  ];

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, contractType, programType]);
  
  const { data, isLoading, error, refetch, isFetching } = useGetContracts({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(contractType ? { contract_type: contractType } : {}),
    ...(programType ? { program_type: programType } : {}),
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-3xl">
          <Input
            placeholder={t("common.searchContracts")}
            className="w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={contractType}
            onValueChange={(val) => {
              setContractType(val === "all" ? "" : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Contract Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contract Types</SelectItem>
              <SelectItem value="student_contract">Student Contract</SelectItem>
              <SelectItem value="internal_regulations">Internal Regulations</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={programType}
            onValueChange={(val) => {
              setProgramType(val === "all" ? "" : val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Program Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Program Types</SelectItem>
              {programTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canModify && (
          <div className="flex justify-end shrink-0">
            <Button onClick={handleOpenCreate}>{t("common.createContract")}</Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>Program Type</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Contract Type</TableHead>
            <TableHead>{t("common.version")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.file") || "File"}</TableHead>
            <TableHead>{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
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
                <TableCell>{contract.program_type || "—"}</TableCell>
                <TableCell>{contract.language?.name || "—"}</TableCell>
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSecureFile(contract.file);
                      }}
                      className="flex items-center gap-1 text-primary hover:underline text-sm"
                    >
                      {t("common.view")} <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canModify && (
                    <RowActionMenu
                      actions={[
                        {
                          label: t("common.edit"),
                          icon: Edit,
                          onClick: () => handleOpenEdit(contract),
                        },
                      ]}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
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
