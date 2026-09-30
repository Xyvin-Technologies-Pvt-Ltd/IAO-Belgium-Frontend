import React from "react";
import { useParams } from "@tanstack/react-router";
import { useGetProformaById } from "@/store/useProformaStore";
import {
  ProformaInvoiceDocument,
  printProformaInvoicePdf,
} from "@/components/admin/ProformaInvoiceDocument";
import { FileCheck, Printer } from "lucide-react";
import { toast } from "sonner";

export default function ProformaInvoicePrintPage() {
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];

  const { data: responseData, isLoading, isError, error } = useGetProformaById(id, {
    enabled: Boolean(id),
  });
  const proforma = responseData?.data || responseData;

  const handlePrint = () => {
    const ok = printProformaInvoicePdf(proforma);
    if (!ok) toast.error("Could not open print dialog");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Loading pro-forma invoice...</p>
        </div>
      </div>
    );
  }

  if (isError || !proforma) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 text-center text-red-700">
          Failed to load invoice: {error?.message || "Not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900 text-white print:hidden shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <FileCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">Pro-forma invoice</h1>
            <p className="text-[11px] text-slate-300 font-mono truncate">{proforma.proforma_number}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto my-6 print:my-0 print:max-w-none bg-white shadow-lg print:shadow-none">
        <ProformaInvoiceDocument proforma={proforma} />
      </div>
    </div>
  );
}
