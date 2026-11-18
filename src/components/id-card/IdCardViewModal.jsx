import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import IdCardFront from "./IdCardFront";

const IdCardViewModal = ({ open, card, onClose, hideProgram = false }) => {
  if (!open || !card) return null;

  const stamp =
    card.status === "expired"
      ? "EXPIRED"
      : card.status === "revoked"
        ? "REVOKED"
        : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white dark:bg-black border dark:border-white/20 p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
                View ID card
              </h3>
              {card.status ? <StatusBadge status={card.status} /> : null}
            </div>
            {card.card_uid ? (
              <p className="text-xs text-muted-foreground mt-1">
                Record ID: {card.card_uid}
              </p>
            ) : null}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <IdCardFront
          card={card}
          muted={["expired", "revoked", "pending", "rejected"].includes(
            card.status,
          )}
          stamp={stamp}
          hideProgram={hideProgram}
        />
      </div>
    </div>
  );
};

export default IdCardViewModal;
