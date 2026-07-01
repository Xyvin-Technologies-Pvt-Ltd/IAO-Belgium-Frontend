import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, FileText, ExternalLink } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Label } from "@/components/ui/label";
import { contractSchema } from "@/validations/admin/contract.validation";
import { useTranslation } from "react-i18next";
import { useCreateContract, useUpdateContract } from "@/store/useContractStore";
import { useGetAllLanguages } from "@/store/useDropdownStore";
import { uploadFile } from "@/api/uploadApi";
import { openSecureFile } from "@/utils/secureFile";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateContract = ({ open, onClose, contractData }) => {
  const { t } = useTranslation();
  const isEdit = !!contractData;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // raw File object, not yet uploaded
  const [fileName, setFileName] = useState("");

  const programTypes = [
    "Master of Science",
    "Lateral Entry Master of Science",
    "Diploma",
    "Manual Therapie",
    "Post Academic Module",
  ];

  const { data: languagesRes } = useGetAllLanguages(undefined, { enabled: open });
  const languages = languagesRes?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: { name: "", file: "", program_type: "", language: "", contract_type: "student_contract" },
  });

  const fileValue = watch("file");
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const handleClose = () => {
    reset({ name: "", file: "", program_type: "", language: "", contract_type: "student_contract" });
    setFileName("");
    setPendingFile(null);
    setIsUploading(false);
    onClose();
  };

  useEffect(() => {
    if (open) {
      if (contractData && isEdit) {
        reset({
          name: contractData.name || "",
          file: contractData.file || "",
          program_type: contractData.program_type || "",
          language: contractData.language?._id || contractData.language || "",
          contract_type: contractData.contract_type || "student_contract"
        });
        if (contractData.file) {
          const urlFileName = contractData.file.split("/").pop().split("?")[0];
          setFileName(urlFileName || "Current file");
        } else {
          setFileName("");
        }
      } else {
        reset({ name: "", file: "", program_type: "", language: "", contract_type: "student_contract" });
        setFileName("");
      }
      setPendingFile(null);
    }
  }, [open, contractData, isEdit, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setFileName(file.name);
    setValue("file", "__pending__", { shouldValidate: true });
  };

  const onSubmit = async (formData) => {
    setIsUploading(true);
    try {
      let fileUrl = formData.file;
      if (pendingFile) {
        if (pendingFile.size === 0) {
          console.error("[CreateContract] ❌ pendingFile.size is 0 — empty file, upload will fail");
        }
        const response = await uploadFile(pendingFile);
        fileUrl = response?.data?.file_url;
        if (!fileUrl) throw new Error("Upload failed");
      }

      const payload = {
        name: formData.name,
        file: fileUrl,
        program_type: formData.program_type,
        language: formData.language,
        contract_type: formData.contract_type
      };

      if (isEdit) {
        updateContract.mutate(
          { id: contractData._id, data: payload },
          { onSuccess: handleClose }
        );
      } else {
        createContract.mutate(payload, { onSuccess: handleClose });
      }
    } catch {
      toast.error(t("contractManagement.messages.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  if (!open) return null;

  const isSubmitting = createContract.isPending || updateContract.isPending || isUploading;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-[32rem] p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? t("contractManagement.editContract") : t("contractManagement.createContract")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/70">
              {isEdit ? t("contractManagement.editSubtitle") : t("contractManagement.createSubtitle")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            label={t("contractManagement.modal.nameLabel")}
            placeholder={t("contractManagement.modal.namePlaceholder")}
            error={errors.name?.message}
            required
            {...register("name")}
          />

          <FormField
            label="Program Type"
            error={errors.program_type?.message}
            required
          >
            <Select
              value={watch("program_type") || ""}
              onValueChange={(val) => setValue("program_type", val, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a Program Type" />
              </SelectTrigger>
              <SelectContent position="popper">
                {programTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Language"
            error={errors.language?.message}
            required
          >
            <Select
              key={languages.length + "-" + (watch("language") || "empty")}
              value={watch("language") || ""}
              onValueChange={(val) => setValue("language", val, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select a Language" />
              </SelectTrigger>
              <SelectContent position="popper">
                {languages.map((l) => (
                  <SelectItem key={l._id} value={l._id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label="Contract Type"
            error={errors.contract_type?.message}
            required
          >
            <Select
              value={watch("contract_type") || ""}
              onValueChange={(val) => setValue("contract_type", val, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select Contract Type" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="student_contract">Student Contract</SelectItem>
                <SelectItem value="internal_regulations">Internal Regulations</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">
              {t("contractManagement.modal.fileLabel")} <span className="text-red-500">*</span>
            </Label>
            <div
              className="border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                {fileValue ? (
                  <>
                    <FileText className="h-8 w-8 text-primary" />
                    <p className="text-sm text-gray-600 dark:text-white/70 truncate max-w-full">
                      {fileName || t("contractManagement.modal.fileSelected")}
                    </p>
                    {isEdit && contractData?.file && !pendingFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSecureFile(contractData.file);
                        }}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {t("contractManagement.modal.viewCurrent")} <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                    <p className="text-xs text-gray-400">{t("contractManagement.modal.clickReplace")}</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      {t("contractManagement.modal.uploadHint")}
                    </p>
                  </>
                )}
              </div>
            </div>
            {errors.file && (
              <p className="text-sm text-red-500">{errors.file.message}</p>
            )}
          </div>

          <FormActions
            onCancel={handleClose}
            isLoading={isSubmitting}
            isEdit={isEdit}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateContract;
