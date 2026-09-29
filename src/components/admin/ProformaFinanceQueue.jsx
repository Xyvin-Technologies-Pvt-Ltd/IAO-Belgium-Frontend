import React, { useState } from "react";
import { useGetFinanceQueue, useUpdateProformaStatus } from "@/store/useProformaStore";
import { CheckCircle, XCircle, Clock, Eye, Search, AlertCircle, Send } from "lucide-react";

export default function ProformaFinanceQueue({ onViewInvoice }) {
  const [statusFilter, setStatusFilter] = useState("TEACHER_SIGNED_APPROVED");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: queueData, isLoading } = useGetFinanceQueue({
    page,
    limit: 10,
    status: statusFilter,
    search,
  });

  const updateStatusMutation = useUpdateProformaStatus();

  const handleMarkPaid = (id) => {
    updateStatusMutation.mutate({
      id,
      data: { status: "PAID", notes: "Marked as paid by backoffice finance manager" },
    });
  };

  const invoices = queueData?.data || [];
  const totalCount = queueData?.total_count || 0;

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Finance Management: Teacher Proforma Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track sent invoices, review teacher-updated claims, and process teacher-signed payouts.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or region..."
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Admin Status Filter Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 md:gap-6 text-sm font-medium">
        <button
          onClick={() => { setStatusFilter("TEACHER_SIGNED_APPROVED"); setPage(1); }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            statusFilter === "TEACHER_SIGNED_APPROVED"
              ? "border-emerald-600 text-emerald-700 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Signed & Approved (Ready for Payout)
        </button>

        <button
          onClick={() => { setStatusFilter("CHANGE_REQUESTED"); setPage(1); }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            statusFilter === "CHANGE_REQUESTED"
              ? "border-amber-600 text-amber-700 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Updated by Teacher (Review Needed)
        </button>

        <button
          onClick={() => { setStatusFilter("SENT_TO_TEACHER"); setPage(1); }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            statusFilter === "SENT_TO_TEACHER"
              ? "border-blue-600 text-blue-700 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Send className="w-4 h-4 text-blue-600" />
          Sent to Teacher (Pending Review)
        </button>

        <button
          onClick={() => { setStatusFilter("PAID"); setPage(1); }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            statusFilter === "PAID"
              ? "border-purple-600 text-purple-700 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Paid
        </button>

        <button
          onClick={() => { setStatusFilter("ALL"); setPage(1); }}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            statusFilter === "ALL"
              ? "border-slate-800 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          All Invoices
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading proforma invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No proforma invoices match the selected status filter.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-xs">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Teacher</th>
                <th className="py-3.5 px-4">Region</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.proforma_number}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {inv.teacher_id?.full_name || inv.teacher_id?.name || "Teacher"}
                    <span className="block text-xs text-slate-400 font-normal">{inv.teacher_id?.email}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{inv.region_snapshot_name}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    €{inv.grand_total?.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        inv.status === "TEACHER_SIGNED_APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : inv.status === "CHANGE_REQUESTED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : inv.status === "SENT_TO_TEACHER"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : inv.status === "PAID"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {inv.status === "SENT_TO_TEACHER"
                        ? "Sent to Teacher"
                        : inv.status === "CHANGE_REQUESTED"
                        ? "Updated by Teacher"
                        : inv.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onViewInvoice?.(inv._id)}
                        className="px-3 py-1 text-xs font-medium border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Breakdown & Logs
                      </button>
                      {inv.status === "TEACHER_SIGNED_APPROVED" && (
                        <button
                          onClick={() => handleMarkPaid(inv._id)}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
