import React, { useRef, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useGetInvoicePrintHtml, useDownloadInvoicePdf } from "@/store/usePaymentStore";
import { Download, FileCheck, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

//* IPB-146: view a KMO application's invoice in a new tab, with Download PDF and
//* Print — same toolbar as the pro-forma invoice print page.
export default function KmoInvoicePrintPage() {
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];
  const invoiceNumber =
    new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("uid") || "";
  const iframeRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(1123);

  const { data: html, isLoading, isError, error } = useGetInvoicePrintHtml(id);
  const downloadPdf = useDownloadInvoicePdf();

  const handlePrint = () => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame) {
      toast.error("Could not open print dialog");
      return;
    }
    frame.focus();
    frame.print();
  };

  const handleDownload = () => {
    downloadPdf.mutate({ id, filename: `${invoiceNumber || "invoice"}.pdf` });
  };

  //* Grow the frame to the invoice height so the page scrolls, not the frame
  const handleFrameLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.body) setFrameHeight(Math.max(doc.body.scrollHeight, 600) + 16);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (isError || !html) {
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
            <h1 className="text-sm font-semibold truncate">KMO invoice</h1>
            <p className="text-[11px] text-slate-300 font-mono truncate">{invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloadPdf.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {downloadPdf.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto my-6 print:my-0 print:max-w-none bg-white shadow-lg print:shadow-none">
        <iframe
          ref={iframeRef}
          title={invoiceNumber || "Invoice"}
          srcDoc={html}
          onLoad={handleFrameLoad}
          className="w-full border-0 block"
          style={{ height: frameHeight }}
        />
      </div>
    </div>
  );
}
