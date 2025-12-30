import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import StatusChip from "../ui/StatusChip";

const InvoiceCard = ({
  status = "paid", // "paid" | "unpaid"
  amount,
  paidOn,
  payBefore,
  onDownload,
  onView,
  onPayNow,
}) => {
  const isPaid = status === "paid";

  return (
    <div className="bg-white/60 rounded-[6px] border border-[#EFEFEF] p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">Payment Status</span>

         <StatusChip status="paid" />
        </div>
        <div className="flex gap-3">
          {isPaid ? (
            <>
              <Button
                variant="outline"
                onClick={onDownload}
                className={"text-[#0088FF] border border-[#0088FF]"}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <Button
                variant="outline"
                onClick={onView}
                className={"text-[#0088FF] border border-[#0088FF]"}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Invoice
              </Button>
            </>
          ) : (
            <Button onClick={onPayNow}>Pay Now</Button>
          )}
        </div>
      </div>

      <div className="border-t border-[#EDEDED]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-base text-muted-foreground">Module Fee</p>
          <p className="text-base font-semibold">${amount}</p>
        </div>

        <div>
          <p className="text-base text-muted-foreground">
            {isPaid ? "Paid on" : "Pay before"}
          </p>
          <p className="text-base font-semibold">
            {isPaid ? paidOn : payBefore}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;
