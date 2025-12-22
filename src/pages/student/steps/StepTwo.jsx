import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLanguageStore } from "@/store/useLanguageStore";
import { FileText, AlertCircle, Info, CloudUpload } from "lucide-react";

const StepTwo = ({ onNext, onSaveAndLogout, applicationData = {} }) => {
  const { t } = useLanguageStore();
  const [uploadedFiles, setUploadedFiles] = useState({
    idCard: applicationData.files?.idCard || null,
    qualification: applicationData.files?.qualification || null,
  });
  const [isCompletingQualification, setIsCompletingQualification] =
    useState(applicationData.isCompletingQualification || false);

  const {
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      idCard: applicationData.files?.idCard || null,
      qualification: applicationData.files?.qualification || null,
      completingQualification: applicationData.isCompletingQualification || false,
    },
  });

  const handleFileUpload = (fileType, event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (fileType, e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFiles((prev) => ({
        ...prev,
        [fileType]: file,
      }));
    }
  };

  const onSubmit = (data) => {
    const stepData = { 
      ...data, 
      files: uploadedFiles, 
      isCompletingQualification 
    };
    console.log("STEP 2 DATA 👉", stepData);
    onNext?.(stepData);
  };

  const FileUploadArea = ({
    fileType,
    title,
    acceptedFormats,
    isOptional = false,
  }) => {
    const file = uploadedFiles[fileType];

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-base font-medium">{title}</Label>
          {!isOptional && <span className="text-red-500">*</span>}
        </div>

        {acceptedFormats && (
          <div className="flex items-center gap-2 text-xs text-[#005AC8] bg-[#F5F7FF] p-2 rounded-md">
            <Info className="h-3 w-3" />
            <span>Accepted Documents: {acceptedFormats}</span>
          </div>
        )}

        <div
          className="border-2 border-dashed border-[#CBD0DC] bg-input rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(fileType, e)}
        >
          {file ? (
            <div className="space-y-3">
              <FileText className="h-8 w-8 text-[#00B300] mx-auto" />
              <div>
                <p className="font-medium text-xs text-[#00B300]">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setUploadedFiles((prev) => ({ ...prev, [fileType]: null }))
                }
              >
                {t?.stepTwo?.fileUpload?.removeFile || "Remove File"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <CloudUpload className="h-12 w-12 text-primary mx-auto" />
              <div>
                <p className="text-sm font-medium">
                  {t?.stepTwo?.fileUpload?.dragDrop ||
                    "Choose a file or drag & drop it here"}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {t?.stepTwo?.fileUpload?.fileSize ||
                    "JPEG, PNG and PDF up to 50MB"}
                </p>
              </div>
              <div>
                <input
                  type="file"
                  id={`${fileType}-upload`}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(fileType, e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById(`${fileType}-upload`).click()
                  }
                >
                  {fileType === "qualification"
                    ? t?.stepTwo?.fileUpload?.browseFiles || "Browse Files"
                    : t?.stepTwo?.fileUpload?.browseFile || "Browse File"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-2xl border border-[#EFEFEF] p-6 space-y-6"
    >
      <div>
        <span className="text-sm text-[#066541] bg-[#49BA6C]/20 px-3 py-1 rounded-full">
          {t?.stepTwo?.stepIndicator || "Step 2 of 3"}
        </span>
        <p className="text-base text-muted-foreground mt-2">
          {t?.stepTwo?.subtitle || "Upload your documents and credentials"}
        </p>
      </div>
      <div className="flex items-center text-xs text-[#A75800] gap-2 p-2 bg-[#FF8904]/10 rounded-[6px]">
        <AlertCircle className="h-3 w-3" />
        <span>
          {t?.stepTwo?.documentRequirements?.description ||
            "Please ensure all documents are clear, legible, and in English or accompanied by certified translations."}
        </span>
      </div>

      <div className="space-y-8">
        <FileUploadArea
          fileType="idCard"
          title={t?.stepTwo?.uploadIdCard?.title || "Upload ID Card"}
          acceptedFormats={
            t?.stepTwo?.uploadIdCard?.acceptedFormats ||
            "Official ID, Passport, Identity Card ID Card"
          }
        />
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="completing-qualification"
            className="mt-1"
            checked={isCompletingQualification}
            onChange={(e) => setIsCompletingQualification(e.target.checked)}
          />
          <label htmlFor="completing-qualification" className="text-sm font-semibold">
            {t?.stepTwo?.uploadQualification?.checkboxLabel ||
              "I'm still completing my qualification. I will submit my diploma later."}
          </label>
        </div>
        {!isCompletingQualification && (
          <FileUploadArea
            fileType="qualification"
            title={
              t?.stepTwo?.uploadQualification?.title ||
              "Upload Your Qualification Certificate"
            }
          />
        )}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              console.log("SAVE & LOGOUT DATA 👉", {
                files: uploadedFiles,
                isCompletingQualification,
              });
              onSaveAndLogout?.();
            }}
          >
            {t?.stepTwo?.buttons?.saveLogout || "Save & Logout"}
          </Button>

          <Button type="submit">
            {t?.stepTwo?.buttons?.nextStep || "Next Step"}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default StepTwo;
