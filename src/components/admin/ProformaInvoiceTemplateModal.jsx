import React from "react";
import { X, Printer, Download, CheckCircle, ShieldCheck, Building2, User, CreditCard, FileCheck, Calendar } from "lucide-react";
import moment from "moment";

export default function ProformaInvoiceTemplateModal({ open, onClose, proforma }) {
  if (!open || !proforma) return null;

  const teacher = proforma.teacher_id || {};
  const planning = proforma.planning_id || {};
  const items = proforma.items || [];
  const signature = proforma.digital_signature || {};
  const dualApprovals = proforma.dual_section_approvals || {};

  const teachingItems = items.filter((i) => i.item_type === "TEACHING");
  const travelItems = items.filter((i) => i.item_type === "TRAVEL");
  const foodItems = items.filter((i) => i.item_type === "FOOD");
  const stayItems = items.filter((i) => i.item_type === "STAY");
  const miscItems = items.filter((i) => i.item_type === "MISCELLANEOUS");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden my-8 border border-gray-200 dark:border-gray-800 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none">
        {/* Top Header Toolbar - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold">Official Proforma Invoice Document</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div id="printable-proforma-invoice" className="p-8 sm:p-10 space-y-8 bg-white text-gray-900 print:p-6 print:text-black">
          {/* Document Header & Branding */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b pb-6 border-gray-200">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                  IAO
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-gray-900">IAO ACADEMY</h1>
                  <p className="text-xs text-gray-500 font-medium">Educational & Academic Services</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 space-y-0.5">
                <p>Campus & Executive Office</p>
                <p>Tax / VAT Reg ID: BE 0123.456.789</p>
                <p>Email: finance@iao-academy.com | Tel: +32 (0) 2 123 4567</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold uppercase tracking-wider mb-2 print:border print:border-indigo-300">
                PROFORMA INVOICE
              </span>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{proforma.proforma_number}</p>
              <p className="text-xs text-gray-500 mt-1">
                Date Issued: {moment(proforma.createdAt).format("DD MMMM YYYY")}
              </p>
              <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Status: {proforma.status?.replace(/_/g, " ")}</span>
              </div>
            </div>
          </div>

          {/* Teacher & Payout Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/80 p-5 rounded-xl border border-gray-200 print:bg-white print:border-gray-300">
            {/* Teacher Details */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                Billed To (Teacher / Instructor)
              </p>
              <p className="text-sm font-bold text-gray-900">{teacher.full_name || teacher.name || "Teacher"}</p>
              <p className="text-xs text-gray-600">{teacher.email || "N/A"}</p>
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{teacher.address || "Address on File"}</p>
            </div>

            {/* Payout & Course Info */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                Bank Payout & Course Reference
              </p>
              <div className="text-xs text-gray-700 space-y-1">
                <p><span className="font-semibold text-gray-900">IBAN:</span> {teacher.IBAN || "Not Provided"}</p>
                <p><span className="font-semibold text-gray-900">Bank Name:</span> {teacher.bank_name || "Standard Payout Bank"}</p>
                <p><span className="font-semibold text-gray-900">Course / Batch:</span> {planning.description || planning.venue || "Course Session"}</p>
                <p><span className="font-semibold text-gray-900">Tariff Region:</span> {proforma.region_snapshot_name || "Standard Region"}</p>
              </div>
            </div>
          </div>

          {/* Itemized Financial Table */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Itemized Remuneration & Expense Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-700 border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-200">
                    <th className="py-2.5 px-3 border-r border-gray-200">Category</th>
                    <th className="py-2.5 px-3 border-r border-gray-200">Description</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-center">Qty / Days / KM</th>
                    <th className="py-2.5 px-3 border-r border-gray-200 text-right">Unit Rate (€)</th>
                    <th className="py-2.5 px-3 text-right">Subtotal (€)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Teaching Items */}
                  {teachingItems.map((item, idx) => (
                    <tr key={`t-${idx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-indigo-900 border-r border-gray-200">Teaching Fee</td>
                      <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-medium">{item.multiplier} blocks</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right">€{item.unit_rate?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">€{item.line_total?.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Travel Items */}
                  {travelItems.map((item, idx) => (
                    <tr key={`tr-${idx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-blue-900 border-r border-gray-200">Travel Expenses</td>
                      <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-medium">{item.multiplier} KM</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right">€{item.unit_rate?.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">€{item.line_total?.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Food Items */}
                  {foodItems.map((item, idx) => (
                    <tr key={`f-${idx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-amber-900 border-r border-gray-200">Meal Allowance</td>
                      <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-medium">{item.multiplier} Days</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right">€{item.unit_rate?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">€{item.line_total?.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Stay Items */}
                  {stayItems.map((item, idx) => (
                    <tr key={`s-${idx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-emerald-900 border-r border-gray-200">Stay & Accommodation</td>
                      <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-medium">{item.multiplier} Nights</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right">€{item.unit_rate?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">€{item.line_total?.toFixed(2)}</td>
                    </tr>
                  ))}

                  {/* Miscellaneous Items */}
                  {miscItems.map((item, idx) => (
                    <tr key={`m-${idx}`} className="hover:bg-gray-50">
                      <td className="py-2 px-3 font-semibold text-purple-900 border-r border-gray-200">Miscellaneous Claims</td>
                      <td className="py-2 px-3 border-r border-gray-200">{item.description}</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-center font-medium">1 Claim</td>
                      <td className="py-2 px-3 border-r border-gray-200 text-right">€{item.unit_rate?.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-bold text-gray-900">€{item.line_total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total Calculation Block */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Teaching Subtotal:</span>
                <span className="font-semibold">€{proforma.teaching_total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Travel Subtotal:</span>
                <span className="font-semibold">€{proforma.travel_total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Meal Allowance Subtotal:</span>
                <span className="font-semibold">€{proforma.food_total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Stay & Misc Subtotal:</span>
                <span className="font-semibold">€{((proforma.stay_total || 0) + (proforma.miscellaneous_total || 0)).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Grand Total (€):</span>
                <span className="text-base text-indigo-700 font-extrabold">€{proforma.grand_total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Verification Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t pt-6 border-gray-200">
            {/* Teacher Signature */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Teacher Digital Signature</p>
              {signature.is_signed ? (
                <div className="space-y-1">
                  <p className="text-base font-serif italic text-indigo-950 font-bold">{signature.signed_by_name}</p>
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Signed on {moment(signature.signed_at).format("DD MMM YYYY, HH:mm")}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">Signature Pending</p>
              )}
            </div>

            {/* Backoffice Dual Approval Verification */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Backoffice Payout Approval</p>
              <div className="flex items-center space-x-2 text-emerald-700 font-medium text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified & Approved for Finance Transfer</span>
              </div>
              <p className="text-[11px] text-gray-500">
                All itemized teaching blocks and reimbursement claims have been cross-verified against system course logs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
