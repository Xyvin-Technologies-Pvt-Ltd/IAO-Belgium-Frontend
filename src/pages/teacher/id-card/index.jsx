import { useState } from "react";
import moment from "moment-timezone";
import IdCardFront from "@/components/id-card/IdCardFront";
import IdCardPendingPreview from "@/components/id-card/IdCardPendingPreview";
import StudentIdPhotoCropModal from "@/components/admin/student-id/StudentIdPhotoCropModal";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddTeacherIdToGoogleWallet,
  useMyTeacherId,
  useSubmitTeacherIdPhoto,
} from "@/store/useTeacherIdStore";
import {
  ENABLE_APPLE_WALLET,
  ENABLE_GOOGLE_WALLET,
} from "@/utils/idCardWallet";

const CARD_TZ = "Europe/Brussels";

const formatDate = (value) =>
  value ? moment.tz(value, CARD_TZ).format("DD/MM/YYYY") : "—";

const formatValidityYearLabel = (validFrom, validUntil) => {
  if (!validFrom || !validUntil) return "";
  const start = moment.tz(validFrom, CARD_TZ).year();
  const end = moment.tz(validUntil, CARD_TZ).year();
  return `${start} – ${end}`;
};

const PANEL_CLASS =
  "bg-white dark:bg-black/10 border dark:border-white/10 rounded-xl flex flex-col items-center px-6 py-8 shadow-sm";

const TeacherIdCardPage = () => {
  const { data, isLoading } = useMyTeacherId();
  const submitMutation = useSubmitTeacherIdPhoto();
  const googleWalletMutation = useAddTeacherIdToGoogleWallet();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [walletComingSoonOpen, setWalletComingSoonOpen] = useState(false);

  const openWalletComingSoon = () => setWalletComingSoonOpen(true);

  const onGoogleWalletClick = () => {
    if (!ENABLE_GOOGLE_WALLET) {
      openWalletComingSoon();
      return;
    }
    googleWalletMutation.mutate();
  };

  const onAppleWalletClick = () => {
    // Apple Wallet API is not implemented yet; always Coming soon for now.
    if (!ENABLE_APPLE_WALLET) {
      openWalletComingSoon();
      return;
    }
    openWalletComingSoon();
  };

  const payload = data?.data || data;
  const eligible = payload?.eligible;
  const current = payload?.current_card;
  const previous = payload?.previous_cards || [];

  if (isLoading) {
    return (
      <div className={`${PANEL_CLASS} justify-center min-h-100 mt-4 py-16`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className={`${PANEL_CLASS} min-h-100 mt-4 justify-center text-center py-16`}>
        <h2 className="text-lg font-semibold text-dashboard-text dark:text-white mb-2">
          IAO Teacher ID not available
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Your account is not eligible for an IAO Teacher ID card.
        </p>
      </div>
    );
  }

  if (!current || current.status === "incomplete") {
    return (
      <>
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            IAO Teacher ID
          </h2>
          <div className={`${PANEL_CLASS} min-h-100 justify-center text-center py-16`}>
            <h3 className="text-lg font-semibold text-dashboard-text dark:text-white mb-2">
              Activate your Teacher ID
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Upload a photo to activate your teacher ID card.
            </p>
            <Button onClick={() => setPhotoOpen(true)}>
              Activate Teacher ID card
            </Button>
          </div>
        </div>
        <StudentIdPhotoCropModal
          open={photoOpen}
          title="Teacher ID photo"
          confirmLabel="Submit for approval"
          isSubmitting={submitMutation.isPending}
          onClose={() => setPhotoOpen(false)}
          onSubmit={async (photo_key) => {
            await submitMutation.mutateAsync(photo_key);
            setPhotoOpen(false);
          }}
        />
      </>
    );
  }

  if (current.status === "rejected") {
    return (
      <>
        <div className="mt-4 space-y-4">
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
            IAO Teacher ID
          </h2>
          <div className={`${PANEL_CLASS} gap-4`}>
            <StatusBadge status="rejected" />
            <div className="w-full max-w-xl rounded-xl border border-red-200 bg-rose-50 dark:bg-rose-950/30 px-5 py-4">
              <p className="text-sm font-semibold mb-1">
                Reason from back office:
              </p>
              <p className="text-sm">{current.rejection_reason || "—"}</p>
            </div>
            <Button onClick={() => setPhotoOpen(true)}>Upload a new photo</Button>
          </div>
        </div>
        <StudentIdPhotoCropModal
          open={photoOpen}
          title="Teacher ID photo"
          confirmLabel="Submit for approval"
          isSubmitting={submitMutation.isPending}
          onClose={() => setPhotoOpen(false)}
          onSubmit={async (photo_key) => {
            await submitMutation.mutateAsync(photo_key);
            setPhotoOpen(false);
          }}
        />
      </>
    );
  }

  if (current.status === "pending") {
    return (
      <div className="mt-4 space-y-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          IAO Teacher ID
        </h2>
        <div className={`${PANEL_CLASS} gap-4`}>
          <StatusBadge status="pending" />
          <IdCardPendingPreview card={current} />
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Your photo is with the back office. You will be notified when your
            card is approved.
          </p>
        </div>
      </div>
    );
  }

  if (current.status === "revoked") {
    return (
      <div className="mt-4 space-y-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          IAO Teacher ID
        </h2>
        <div className={`${PANEL_CLASS} gap-4`}>
          <StatusBadge status="revoked" />
          <IdCardFront card={current} muted stamp="REVOKED" hideProgram />
          {current.revocation_reason ? (
            <div className="w-full max-w-xl rounded-xl border border-red-200 bg-rose-50 dark:bg-rose-950/30 px-5 py-4 text-center sm:text-left">
              <p className="text-sm font-semibold mb-1 text-red-900 dark:text-red-200">
                Reason from back office:
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">
                {current.revocation_reason}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Your teacher ID is no longer valid. Contact the back office if you have questions.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (current.status === "expired") {
    const nextIssue = current.valid_until
      ? moment.tz(current.valid_until, CARD_TZ).add(1, "day").format("DD/MM/YYYY")
      : "01/09";
    return (
      <div className="mt-4 space-y-4">
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          IAO Teacher ID
        </h2>
        <div className={`${PANEL_CLASS} gap-4`}>
          <StatusBadge status="expired" />
          <IdCardFront card={current} muted stamp="EXPIRED" hideProgram />
          <p className="text-sm text-muted-foreground text-center max-w-lg">
            Your card expired on {formatDate(current.valid_until)}. A new card
            is issued automatically on {nextIssue}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        IAO Teacher ID
      </h2>
      <div className={`${PANEL_CLASS} gap-6`}>
        <StatusBadge status="active" />
        <div className="w-full max-w-xl p-2">
          <IdCardFront card={current} hideProgram />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            disabled={ENABLE_GOOGLE_WALLET && googleWalletMutation.isPending}
            onClick={onGoogleWalletClick}
          >
            {ENABLE_GOOGLE_WALLET && googleWalletMutation.isPending
              ? "Opening Google Wallet…"
              : "Add to Google Wallet"}
          </Button>
          <Button type="button" onClick={onAppleWalletClick}>
            Add to Apple Wallet
          </Button>
        </div>

        <Dialog
          open={walletComingSoonOpen}
          onOpenChange={setWalletComingSoonOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Coming soon</DialogTitle>
              <DialogDescription>
                Adding your ID card to a digital wallet is not available yet.
                Please check back later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={() => setWalletComingSoonOpen(false)}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {previous.length > 0 ? (
          <div className="w-full max-w-2xl mt-4">
            <h4 className="text-sm font-semibold mb-3">Previous cards</h4>
            <div className="space-y-3">
              {previous.map((card) => (
                <div
                  key={card.document_id}
                  className="flex items-center gap-3 rounded-xl border dark:border-white/10 bg-white dark:bg-black/20 p-3"
                >
                  <div className="w-12 h-14 bg-gray-100 dark:bg-white/5 border dark:border-white/10 overflow-hidden rounded">
                    {card.photo_url ? (
                      <img
                        src={card.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {card.card_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Valid {formatDate(card.valid_from)} –{" "}
                      {formatDate(card.valid_until)}
                    </p>
                  </div>
                  <StatusBadge status={card.status} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default TeacherIdCardPage;
