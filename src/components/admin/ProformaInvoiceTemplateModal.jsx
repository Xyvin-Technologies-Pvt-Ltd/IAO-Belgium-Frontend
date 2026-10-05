import { X, Printer, FileCheck } from "lucide-react";
import {
  ProformaInvoiceDocument,
  printProformaInvoicePdf,
} from "@/components/admin/ProformaInvoiceDocument";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/** @deprecated Prefer opening /admin/proforma-invoices/:id/print in a new tab */
export default function ProformaInvoiceTemplateModal({ open, onClose, proforma }) {
  const { t } = useTranslation();
  if (!open || !proforma) return null;

  const handlePrint = () => {
    const ok = printProformaInvoicePdf(proforma);
    if (!ok) toast.error("Could not open print dialog");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 border border-gray-200 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:rounded-none">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold">{t("proforma.title")}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <ProformaInvoiceDocument proforma={proforma} />
      </div>
    </div>
  );
}
