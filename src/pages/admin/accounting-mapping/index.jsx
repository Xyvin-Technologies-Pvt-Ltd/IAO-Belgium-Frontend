import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  createAccountingMapping,
  deleteAccountingMapping,
  getAccountingMappings,
  getGlobalVatConfig,
  updateAccountingMapping,
  updateGlobalVatConfig,
} from "@/api/accountingMappingApi";
import { getProgramTypes } from "@/api/programApi";
import { PROGRAM_TYPES } from "@/constants/programTypes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import RowActionMenu from "@/components/ui/table/RowActionMenu";
import DeleteConfirm from "@/components/DeleteConfirm";
import ErrorMessage from "@/components/common/ErrorMessage";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import SearchableSelect from "@/components/ui/forms/SearchableSelect";
import { useGetAllCountries, useGetAllLanguages } from "@/store/useDropdownStore";

const DEFAULT_FORM = {
  language: "",
  country: "",
  program_type: "",
  gl_revenue_module: "",
  gl_revenue_research: "",
  gl_revenue_admission_fee: "",
  gl_revenue_convenience_fee: "",
};

const AccountingMappings = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  const mappingQuery = useQuery({
    queryKey: ["accounting-mappings", { page, limit: rowsPerPage, search: debouncedSearch }],
    queryFn: () =>
      getAccountingMappings({
        page,
        limit: rowsPerPage,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      }),
    placeholderData: (previous) => previous,
    staleTime: 30000,
  });

  const vatQuery = useQuery({
    queryKey: ["global-vat-config"],
    queryFn: getGlobalVatConfig,
    staleTime: 30000,
  });

  const programTypesQuery = useQuery({
    queryKey: ["program-types"],
    queryFn: getProgramTypes,
    staleTime: 60000,
  });

  const availableProgramTypes = useMemo(
    () => programTypesQuery.data?.data || PROGRAM_TYPES,
    [programTypesQuery.data],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["accounting-mappings"] });
  };

  const createMutation = useMutation({
    mutationFn: createAccountingMapping,
    onSuccess: (res) => {
      toast.success(res?.message || "Accounting mapping created");
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to create accounting mapping");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAccountingMapping(id, payload),
    onSuccess: (res) => {
      toast.success(res?.message || "Accounting mapping updated");
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update accounting mapping");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccountingMapping,
    onSuccess: (res) => {
      toast.success(res?.message || "Accounting mapping deleted");
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete accounting mapping");
    },
  });

  const globalVatMutation = useMutation({
    mutationFn: updateGlobalVatConfig,
    onSuccess: (res) => {
      toast.success(res?.message || "Global VAT updated");
      queryClient.invalidateQueries({ queryKey: ["global-vat-config"] });
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update global VAT");
    },
  });

  const openCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteId);
    } finally {
      setDeleteId(null);
      setOpenDelete(false);
    }
  };

  const items = mappingQuery.data?.data || [];
  const totalRows = mappingQuery.data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          {t("accountingMappingManagement.title", "Accounting Mappings")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "accountingMappingManagement.subtitle",
            "Manage revenue GL codes by language, country and program type.",
          )}
        </p>
      </div>

      <GlobalVatCard
        value={vatQuery.data?.data?.vat_code || ""}
        source={vatQuery.data?.data?.source}
        isLoading={vatQuery.isLoading}
        isUpdating={globalVatMutation.isPending}
        onSave={(vat_code) => globalVatMutation.mutate({ vat_code })}
      />

      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("accountingMappingManagement.search", "Search...")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t("accountingMappingManagement.create", "Create")}
        </Button>
      </div>

      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("programManagement.modal.languageLabel", "Language")}</TableHead>
            <TableHead>{t("common.country", "Country")}</TableHead>
            <TableHead>{t("programManagement.modal.programTypeLabel", "Program Type")}</TableHead>
            <TableHead>{t("accountingMappingManagement.table.module", "Module GL")}</TableHead>
            <TableHead>{t("accountingMappingManagement.table.research", "Research GL")}</TableHead>
            <TableHead>{t("accountingMappingManagement.table.admission", "Admission GL")}</TableHead>
            <TableHead>{t("accountingMappingManagement.table.convenience", "Convenience GL")}</TableHead>
            <TableHead>{t("common.action", "Action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={mappingQuery.isFetching ? "opacity-50 pointer-events-none" : ""}>
          {mappingQuery.isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : mappingQuery.error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={
                    mappingQuery.error?.message ||
                    t("accountingMappingManagement.messages.loadFailed", "Failed to load mappings")
                  }
                  onRetry={mappingQuery.refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : items.length ? (
            items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.language?.name || "-"}</TableCell>
                <TableCell>
                  {item.country?.name
                    ? `${item.country.name}${item.country.code ? ` (${item.country.code})` : ""}`
                    : t("accountingMappingManagement.table.onlineFallback", "Online / default")}
                </TableCell>
                <TableCell>{item.program_type}</TableCell>
                <TableCell>{item.gl_revenue_module || "-"}</TableCell>
                <TableCell>{item.gl_revenue_research || "-"}</TableCell>
                <TableCell>{item.gl_revenue_admission_fee || "-"}</TableCell>
                <TableCell>{item.gl_revenue_convenience_fee || "-"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActionMenu
                    actions={[
                      {
                        label: t("common.edit", "Edit"),
                        icon: Edit,
                        onClick: () => openEdit(item),
                      },
                      {
                        label: t("common.delete", "Delete"),
                        icon: Trash2,
                        onClick: () => handleDelete(item._id),
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                {t("accountingMappingManagement.table.noItems", "No mappings found")}
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

      <AccountingMappingModal
        open={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        createMutation={createMutation}
        updateMutation={updateMutation}
        programTypes={availableProgramTypes}
      />

      <DeleteConfirm
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        count={1}
        isLoading={deleteMutation.isPending}
        data={t("accountingMappingManagement.entity", "Accounting mapping")}
      />
    </div>
  );
};

const GlobalVatCard = ({ value, source, isLoading, isUpdating, onSave }) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { vat_code: value || "" },
  });

  const { t } = useTranslation();

  useEffect(() => {
    reset({ vat_code: value || "" });
  }, [value, reset]);

  return (
    <div className="rounded-xl border p-4 space-y-3">
 
      <form
        className="flex items-end gap-2 max-w-md"
        onSubmit={handleSubmit((form) => onSave(form.vat_code?.trim().toUpperCase() || ""))}
      >
        <FormField
          label={t("programManagement.modal.exactVatCodeLabel", "Exact VAT Code")}
          placeholder="VH"
          {...register("vat_code", { required: true })}
        />
        <Button type="submit" disabled={isLoading || isUpdating}>
          {t("common.save", "Save")}
        </Button>
      </form>
    </div>
  );
};

const AccountingMappingModal = ({
  open,
  item,
  onClose,
  createMutation,
  updateMutation,
  programTypes,
}) => {
  const isEdit = Boolean(item);
  const { t } = useTranslation();
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [languageSearchTerm, setLanguageSearchTerm] = useState("");
  const { data: countriesData, isLoading: countriesLoading } = useGetAllCountries(
    {
      ...(countrySearchTerm ? { search: countrySearchTerm } : {}),
    },
    { enabled: open },
  );
  const { data: languagesData, isLoading: languagesLoading } = useGetAllLanguages(
    {
      ...(languageSearchTerm ? { search: languageSearchTerm } : {}),
    },
    { enabled: open },
  );
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: DEFAULT_FORM,
  });

  const selectedProgramType = watch("program_type");
  const selectedCountry = watch("country");
  const selectedLanguage = watch("language");

  const programTypeOptions = useMemo(() => {
    const types = [...(programTypes || [])];
    if (item?.program_type && !types.includes(item.program_type)) {
      types.unshift(item.program_type);
    }
    return types;
  }, [programTypes, item?.program_type]);

  const handleClose = () => {
    reset(DEFAULT_FORM);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    if (!item) {
      reset(DEFAULT_FORM);
      return;
    }
    reset({
      language: item.language?._id || item.language || "",
      country: item.country?._id || item.country || "",
      program_type: item.program_type || "",
      gl_revenue_module: item.gl_revenue_module || "",
      gl_revenue_research: item.gl_revenue_research || "",
      gl_revenue_admission_fee: item.gl_revenue_admission_fee || "",
      gl_revenue_convenience_fee: item.gl_revenue_convenience_fee || "",
    });
  }, [open, item, reset]);

  const onSubmit = (formData) => {
    if (!formData.language) {
      toast.error(t("programManagement.modal.languagePlaceholder", "Select language"));
      return;
    }

    const payload = {
      language: formData.language,
      country: formData.country || null,
      program_type: formData.program_type,
      gl_revenue_module: formData.gl_revenue_module?.trim() || "",
      gl_revenue_research: formData.gl_revenue_research?.trim() || "",
      gl_revenue_admission_fee: formData.gl_revenue_admission_fee?.trim() || "",
      gl_revenue_convenience_fee: formData.gl_revenue_convenience_fee?.trim() || "",
    };

    const mutation = isEdit ? updateMutation : createMutation;
    const args = isEdit ? { id: item._id, payload } : payload;
    mutation.mutate(args, { onSuccess: handleClose });
  };

  if (!open) return null;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit
                ? t("accountingMappingManagement.modal.editTitle", "Edit Accounting Mapping")
                : t("accountingMappingManagement.modal.createTitle", "Create Accounting Mapping")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {t(
                "accountingMappingManagement.modal.subtitle",
                "Configure GL codes for language + country + program type. Leave country empty for online/default mappings.",
              )}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              label={t("programManagement.modal.languageLabel", "Language")}
              placeholder={t("programManagement.modal.languagePlaceholder", "Select language")}
              searchPlaceholder={t("programManagement.modal.searchLanguages", "Search languages...")}
              items={languagesData?.data || []}
              value={selectedLanguage || ""}
              onChange={(value) => setValue("language", value, { shouldValidate: true })}
              onSearch={setLanguageSearchTerm}
              isLoading={languagesLoading}
              required
            />

            <SearchableSelect
              label={t("programManagement.modal.countryLabel", "Country")}
              placeholder={t(
                "accountingMappingManagement.modal.countryOptionalPlaceholder",
                "Select country (optional for online)",
              )}
              searchPlaceholder={t("programManagement.modal.searchCountries", "Search countries...")}
              items={countriesData?.data || []}
              value={selectedCountry || ""}
              onChange={(value) => setValue("country", value, { shouldValidate: true })}
              onSearch={setCountrySearchTerm}
              isLoading={countriesLoading}
            />

            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label>
                {t("programManagement.modal.programTypeLabel", "Program Type")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                key={item?._id ? `${item._id}-${selectedProgramType || "type"}` : selectedProgramType || "create"}
                value={selectedProgramType || ""}
                onValueChange={(value) => setValue("program_type", value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("programManagement.modal.programTypePlaceholder", "Select program type")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {programTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("programManagement.modal.exactGlRevenueModuleLabel", "Module Revenue GL")}
              {...register("gl_revenue_module")}
            />
            <FormField
              label={t("programManagement.modal.exactGlRevenueResearchLabel", "Research Revenue GL")}
              {...register("gl_revenue_research")}
            />
            <FormField
              label={t(
                "programManagement.modal.exactGlRevenueAdmissionFeeLabel",
                "Admission Fee Revenue GL",
              )}
              {...register("gl_revenue_admission_fee")}
            />
            <FormField
              label={t(
                "programManagement.modal.exactGlRevenueConvenienceFeeLabel",
                "Convenience Fee Revenue GL",
              )}
              {...register("gl_revenue_convenience_fee")}
            />
          </div>

          <FormActions onCancel={handleClose} isLoading={isSubmitting} isEdit={isEdit} />
        </form>
      </div>
    </div>
  );
};

export default AccountingMappings;
