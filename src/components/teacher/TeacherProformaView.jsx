import React, { useState } from "react";
import { 
  CheckCircle, AlertCircle, FileText, ShieldCheck, 
  Plus, Paperclip, Clock, X, DollarSign, MapPin 
} from "lucide-react";
import { useSignProforma, useAddMiscellaneousClaim } from "@/store/useProformaStore";

export default function TeacherProformaView({ proformaData }) {
  const [showSignModal, setShowSignModal] = useState(false);
  const [showMiscModal, setShowMiscModal] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [miscForm, setMiscForm] = useState({ description: "", amount: "", note: "" });

  const signMutation = useSignProforma();
  const addMiscMutation = useAddMiscellaneousClaim();

  const isSigned = proformaData?.digital_signature?.is_signed;

  const handleSign = () => {
    if (!signatureName.trim()) return;
    signMutation.mutate(
      {
        id: proformaData._id,
        data: { signed_by_name: signatureName.trim() },
      },
      {
        onSuccess: () => {
          setShowSignModal(false);
          setSignatureName("");
        },
      }
    );
  };

  const handleAddMisc = () => {
    if (!miscForm.description.trim() || !miscForm.amount) return;
    addMiscMutation.mutate(
      {
        id: proformaData._id,
        data: {
          description: miscForm.description.trim(),
          amount: parseFloat(miscForm.amount),
          receipt_note: miscForm.note.trim(),
        },
      },
      {
        onSuccess: () => {
          setShowMiscModal(false);
          setMiscForm({ description: "", amount: "", note: "" });
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-slate-800">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{proformaData.proforma_number}</h1>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                isSigned
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {isSigned ? "Signed & Approved" : proformaData.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Region: <span className="font-medium text-slate-700">{proformaData.region_snapshot_name}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuditDrawer(true)}
            className="px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
          >
            <Clock className="w-4 h-4 text-slate-500" />
            Audit Log ({proformaData.audit_logs?.length || 0})
          </button>
          {!isSigned && (
            <>
              <button
                onClick={() => setShowMiscModal(true)}
                className="px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded-xl transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                Add Claim
              </button>
              <button
                onClick={() => setShowSignModal(true)}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                Sign Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Teaching Fee</p>
          <p className="text-xl font-bold text-slate-900 mt-1">€{proformaData.teaching_total?.toFixed(2) || "0.00"}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Travel Cost</p>
          <p className="text-xl font-bold text-slate-900 mt-1">€{proformaData.travel_total?.toFixed(2) || "0.00"}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Meal Allowance</p>
          <p className="text-xl font-bold text-slate-900 mt-1">€{proformaData.food_total?.toFixed(2) || "0.00"}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Miscellaneous</p>
          <p className="text-xl font-bold text-slate-900 mt-1">€{proformaData.miscellaneous_total?.toFixed(2) || "0.00"}</p>
        </div>
        <div className="bg-emerald-900 text-white p-4 rounded-xl shadow-md col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-emerald-200 uppercase">Total Payable</p>
          <p className="text-2xl font-extrabold mt-1">€{proformaData.grand_total?.toFixed(2)}</p>
        </div>
      </div>

      {/* Single Unified Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Itemized Proforma Calculation Breakdown</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-xs">
            <tr>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 text-center">Qty / Distance</th>
              <th className="py-3 px-4 text-right">Unit Rate</th>
              <th className="py-3 px-4 text-right">Total (€)</th>
              <th className="py-3 px-4 text-center">Receipts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proformaData.items?.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition">
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                      item.item_type === "TEACHING"
                        ? "bg-blue-50 text-blue-700"
                        : item.item_type === "TRAVEL"
                        ? "bg-amber-50 text-amber-700"
                        : item.item_type === "FOOD"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-purple-50 text-purple-700"
                    }`}
                  >
                    {item.item_type}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-900">
                  {item.description}
                  {item.teacher_role_name && (
                    <span className="block text-xs text-slate-500 font-normal">Role: {item.teacher_role_name}</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center font-mono">
                  {item.item_type === "TRAVEL"
                    ? `${item.distance_km} km`
                    : item.item_type === "TEACHING"
                    ? `${item.blocks || item.multiplier || 1} blocks`
                    : item.multiplier
                    ? item.multiplier
                    : item.hours
                    ? `${item.hours} hrs`
                    : "1"}
                </td>
                <td className="py-3.5 px-4 text-right font-mono">€{item.unit_rate?.toFixed(2)}</td>
                <td className="py-3.5 px-4 text-right font-semibold font-mono text-slate-900">
                  €{item.line_total?.toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {item.attachments?.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Paperclip className="w-3 h-3" /> {item.attachments.length}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Digital Signature Modal (Type Legal Name Only) */}
      {showSignModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Sign Invoice by Typing Legal Name</h2>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Legal Name</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 text-sm border border-slate-300 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                disabled={!signatureName.trim() || signMutation.isPending}
                onClick={handleSign}
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl disabled:opacity-50"
              >
                {signMutation.isPending ? "Signing..." : "Confirm & Sign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Miscellaneous Claim Modal */}
      {showMiscModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Custom Claim</h2>
              <button onClick={() => setShowMiscModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description / Item Title</label>
              <input
                type="text"
                value={miscForm.description}
                onChange={(e) => setMiscForm({ ...miscForm, description: e.target.value })}
                placeholder="e.g. Highway Parking Toll Receipt #402"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount (€)</label>
              <input
                type="number"
                step="0.01"
                value={miscForm.amount}
                onChange={(e) => setMiscForm({ ...miscForm, amount: e.target.value })}
                placeholder="15.00"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Note (Optional)</label>
              <input
                type="text"
                value={miscForm.note}
                onChange={(e) => setMiscForm({ ...miscForm, note: e.target.value })}
                placeholder="Attached receipt"
                className="w-full px-4 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowMiscModal(false)} className="px-4 py-2 text-sm border rounded-xl">
                Cancel
              </button>
              <button
                disabled={!miscForm.description.trim() || !miscForm.amount || addMiscMutation.isPending}
                onClick={handleAddMisc}
                className="px-5 py-2 text-sm bg-emerald-600 text-white rounded-xl disabled:opacity-50"
              >
                Add Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Slide-Out Drawer */}
      {showAuditDrawer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-50">
          <div className="bg-white max-w-md w-full h-full p-6 shadow-2xl space-y-6 overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-bold text-slate-900">Audit Trail History</h2>
              <button onClick={() => setShowAuditDrawer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {proformaData.audit_logs?.map((log, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  <div className="text-xs text-slate-400 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5">
                    {log.performed_by_name} ({log.performed_by_role}) - <span className="text-emerald-700 font-mono">{log.action}</span>
                  </div>
                  {log.field_changed && (
                    <p className="text-xs font-mono text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border">
                      Field: {log.field_changed} <br />
                      Old: {log.old_value} ➔ New: {log.new_value}
                    </p>
                  )}
                  {log.notes && <p className="text-xs text-slate-500 italic mt-1">{log.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
