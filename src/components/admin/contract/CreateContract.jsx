import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload, FileText, ExternalLink } from "lucide-react";
import FormField from "@/components/ui/forms/FormField";
import FormActions from "@/components/ui/forms/FormActions";
import { Label } from "@/components/ui/label";
import { contractSchema } from "@/validations/admin/contract.validation";
import { useTranslation } from "react-i18next";
import { useCreateContract, useUpdateContract } from "@/store/useContractStore";
import { useGetPrograms } from "@/store/useProgramStore";
import { uploadFile } from "@/api/uploadApi";
import { toast } from "sonner";

const CreateContract = ({ open, onClose, contractData }) => {
  const { t } = useTranslation();
  const isEdit = !!contractData;
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // raw File object, not yet uploaded
  const [fileName, setFileName] = useState("");

  const { data: programsRes } = useGetPrograms({ limit: 1000 });
  const programs = programsRes?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: { name: "", file: "", program: "", contract_type: "student_contract" },
  });

  const fileValue = watch("file");
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();

  const handleClose = () => {
    reset({ name: "", file: "", program: "", contract_type: "student_contract" });
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
          program: contractData.program?._id || contractData.program || "",
          contract_type: contractData.contract_type || "student_contract"
        });
        if (contractData.file) {
          const urlFileName = contractData.file.split("/").pop().split("?")[0];
          setFileName(urlFileName || "Current file");
        } else {
          setFileName("");
        }
      } else {
        reset({ name: "", file: "", program: "", contract_type: "student_contract" });
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
        program: formData.program,
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
      <div className="bg-white dark:bg-black border dark:border-white/20 rounded-xl shadow-lg w-96 p-6">
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
            label="Program"
            error={errors.program?.message}
            required
          >
            <select
              {...register("program")}
              className="w-full border rounded-lg p-2 bg-transparent text-sm border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="" className="bg-white dark:bg-black">Select a Program</option>
              {programs.map(p => (
                <option key={p._id} value={p._id} className="bg-white dark:bg-black">{p.name}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Contract Type"
            error={errors.contract_type?.message}
            required
          >
            <select
              {...register("contract_type")}
              className="w-full border rounded-lg p-2 bg-transparent text-sm border-gray-200 dark:border-white/20 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="student_contract" className="bg-white dark:bg-black">Student Contract</option>
              <option value="internal_regulations" className="bg-white dark:bg-black">Internal Regulations</option>
            </select>
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
                      <a
                        href={contractData.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {t("contractManagement.modal.viewCurrent")} <ExternalLink className="h-3 w-3" />
                      </a>
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
