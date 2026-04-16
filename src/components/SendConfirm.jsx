import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";

const SendConfirm = ({ open, onClose, onConfirm, isLoading = false }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send size={16} className="text-green-500" />
            {t("common.sendConfirm.title")}
          </DialogTitle>
          <DialogDescription>
            {t("common.sendConfirm.message")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.sendConfirm.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? t("common.sendConfirm.sending") : t("common.sendConfirm.send")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendConfirm;
