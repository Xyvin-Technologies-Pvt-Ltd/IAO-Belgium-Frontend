import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBulkUploadQuestions } from "@/store/useQuestionBankStore";

const CSV_TEMPLATE = `question_text;option_a;option_b;option_c;option_d;correct_answer;explanation;difficulty
"What is 2+2?";"3";"4";"5";"6";"B";"Basic arithmetic";"remember"
"What is the capital of France?";"London";"Paris";"Berlin";"Madrid";"B";"Paris is the capital";"understand"`;

const BulkUploadDialog = ({ open, onClose, questionBankId, onSuccess }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const bulkUpload = useBulkUploadQuestions();

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const isCsv = f.name.endsWith(".csv") || f.type === "text/csv" || f.type === "application/vnd.ms-excel";
      if (!isCsv) {
        toast.error(t("questionBank.messages.invalidFile"));
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(f);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      await bulkUpload.mutateAsync({
        questionBankId,
        file,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  const handleClose = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("questionBank.bulkUpload.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("questionBank.bulkUpload.description")}
          </p>
          <Button variant="outline" onClick={downloadTemplate}>
            {t("questionBank.bulkUpload.downloadTemplate")}
          </Button>
          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-10 w-10 text-muted-foreground" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("questionBank.bulkUpload.selectFile")}
            </Button>
            {file && (
              <p className="text-sm text-muted-foreground">{file.name}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || bulkUpload.isPending}
            >
              {bulkUpload.isPending
                ? t("common.uploading")
                : t("questionBank.bulkUpload.upload")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;
