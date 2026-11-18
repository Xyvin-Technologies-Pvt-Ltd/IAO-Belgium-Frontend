import { useState } from "react";
import moment from "moment-timezone";
import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import StatusBadge from "@/components/StatusBadge";
import IdCardFront from "@/components/id-card/IdCardFront";
import IdCardViewModal from "@/components/id-card/IdCardViewModal";
import { useTeacherIdUserCard } from "@/store/useTeacherIdStore";
import { useStudentIdApplicationCard } from "@/store/useStudentIdStore";

const CARD_TZ = "Europe/Brussels";

const formatDate = (value) =>
  value ? moment.tz(value, CARD_TZ).format("DD/MM/YYYY") : "—";

const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

/**
 * Reusable Documents tab section displaying identity card details,
 * preview, metadata, and previous cards.
 *
 * @param {"teacher" | "student"} type
 * @param {string} id - Teacher user ID or Student application ID
 * @param {string} [userName]
 */
const IdCardDocumentTab = ({ type = "student", id, userName }) => {
  const { t } = useTranslation();
  const [viewCard, setViewCard] = useState(null);

  const isTeacher = type === "teacher";

  const { data: teacherCardData, isLoading: teacherLoading } =
    useTeacherIdUserCard(id, {
      enabled: isTeacher && Boolean(id),
    });

  const { data: studentCardData, isLoading: studentLoading } =
    useStudentIdApplicationCard(id, {
      enabled: !isTeacher && Boolean(id),
    });

  const isLoading = isTeacher ? teacherLoading : studentLoading;
  const payload = isTeacher
    ? teacherCardData?.data || teacherCardData
    : studentCardData?.data || studentCardData;

  const current = payload?.current_card;
  const previous = payload?.previous_cards || [];

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-black/20 p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-64 w-full max-w-xl mx-auto bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
          <div className="h-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-black/20 p-6 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-[#ff8904]" />
            <h3 className="text-base font-semibold text-dashboard-text dark:text-white">
              {isTeacher
                ? t("idCard.teacherTitle", "Teacher Identity Card")
                : t("idCard.studentTitle", "Student Identity Card")}
            </h3>
            {current?.status ? <StatusBadge status={current.status} /> : null}
            {current?.card_uid ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[#ff8904]/10 text-[#ff8904] dark:bg-[#ff8904]/20 border border-[#ff8904]/30">
                {current.card_uid}
              </span>
            ) : null}
          </div>
        </div>

        {/* Card Content */}
        {current ? (
          <div className="space-y-6">
            <div className="w-full max-w-xl mx-auto">
              <IdCardFront
                card={current}
                muted={["expired", "revoked", "pending", "rejected"].includes(
                  current.status,
                )}
                stamp={
                  current.status === "expired"
                    ? "EXPIRED"
                    : current.status === "revoked"
                      ? "REVOKED"
                      : null
                }
                hideProgram={isTeacher}
              />
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("idCard.recordId", "Record ID")}
                </p>
                <p className="font-semibold text-dashboard-text dark:text-white text-sm mt-0.5 truncate">
                  {current.card_uid || "—"}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("common.statusLabel", "Status")}
                </p>
                <div className="mt-0.5">
                  <StatusBadge status={current.status} />
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("idCard.validFrom", "Valid from")}
                </p>
                <p className="font-semibold text-dashboard-text dark:text-white text-sm mt-0.5">
                  {formatDate(current.valid_from)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("idCard.validUntil", "Valid until")}
                </p>
                <p className="font-semibold text-dashboard-text dark:text-white text-sm mt-0.5">
                  {formatDate(current.valid_until)}
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("idCard.academicYear", "Academic year")}
                </p>
                <p className="font-semibold text-dashboard-text dark:text-white text-sm mt-0.5 truncate">
                  {current.academic?.name || "—"}
                </p>
              </div>
            </div>

            {/* Previous Cards History */}
            {previous.length > 0 ? (
              <div className="border-t border-gray-100 dark:border-white/10 pt-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("idCard.previousCards", "Previous cards")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {previous.map((prevCard) => (
                    <div
                      key={prevCard.document_id}
                      className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      onClick={() => setViewCard(prevCard)}
                    >
                      <div className="w-10 h-12 bg-gray-200 dark:bg-white/10 border dark:border-white/10 overflow-hidden rounded shrink-0">
                        {prevCard.photo_url ? (
                          <img
                            src={prevCard.photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-dashboard-text dark:text-white truncate">
                            {prevCard.card_uid || prevCard.card_title || "ID Card"}
                          </p>
                          <StatusBadge status={prevCard.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(prevCard.valid_from)} –{" "}
                          {formatDate(prevCard.valid_until)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 px-4 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-dashboard-text dark:text-white">
              {t("idCard.noCardIssued", "No ID card issued yet")}
            </h4>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {isTeacher
                ? t(
                    "idCard.noTeacherCardDesc",
                    "This lecturer does not currently have an active or issued teacher identity card.",
                  )
                : t(
                    "idCard.noStudentCardDesc",
                    "This student does not currently have an active or issued student identity card.",
                  )}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Preview Modal */}
      <IdCardViewModal
        open={Boolean(viewCard)}
        card={viewCard}
        onClose={() => setViewCard(null)}
        hideProgram={isTeacher}
      />
    </div>
  );
};

export default IdCardDocumentTab;
