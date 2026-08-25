import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { formatTZ } from "@/utils/dateUtils";

const ViewPlanning = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();

  if (!open || !planningData) return null;

  const getBadgeStyles = (status) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-black w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border dark:border-white/20 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 border-b dark:border-white/20">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("planningManagement.view.moduleLabel")}:{" "}
              {planningData?.component?.name || "N/A"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <InfoItem
              label={t("planningManagement.view.programLabel")}
              value={planningData?.component?.program?.name || "N/A"}
            />
            <InfoItem
              label={t("planningManagement.view.batchLabel")}
              value={planningData?.batch?.name || "N/A"}
            />
            <InfoItem
              label="Students"
              value={planningData?.student_count || 0}
            />
            {planningData?.description && (
              <InfoItem
                label={t("planningManagement.view.descriptionLabel")}
                value={planningData.description}
              />
            )}
          </div>
          {planningData?.sessions && planningData.sessions.length > 0 && (
            <div className="space-y-6">
              {planningData.sessions.map((session, index) => (
                <div key={session._id || index}>
                  {index > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t("planningManagement.view.sessionLabel")} {index + 1}
                    </h3>

                    <InfoItem
                      label={t("planningManagement.view.sessionNameLabel")}
                      value={session.name || "N/A"}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoItem
                        label={t("planningManagement.view.dateLabel")}
                        value={
                          formatTZ(session.session_date, "YYYY-MM-DD") || "N/A"
                        }
                      />
                      <InfoItem
                        label={t("planningManagement.view.timeFromLabel")}
                        value={formatTZ(session.start_time, "HH:mm") || "N/A"}
                      />
                      <InfoItem
                        label={t("planningManagement.view.timeTillLabel")}
                        value={formatTZ(session.end_time, "HH:mm") || "N/A"}
                      />
                    </div>

                    {session.teachers && session.teachers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.view.teachersLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.teachers.map((teacherObj, teacherIndex) => {
                            const teacher = teacherObj.teacher || teacherObj;
                            const teacherName =
                              teacher.first_name && teacher.last_name
                                ? `${teacher.last_name} ${teacher.first_name}`.trim()
                                : teacher.name || "Unknown Teacher";
                            const status = teacherObj.status || "pending";

                            return (
                              <Badge
                                key={teacher._id || teacherIndex}
                                variant="outline"
                                className={`text-xs  capitalize ${getBadgeStyles(status)}`}
                              >
                                {teacherName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {session.assistants && session.assistants.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.modal.assistantsLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.assistants.map(
                            (assistantObj, assistantIndex) => {
                              const assistant =
                                assistantObj.assistant || assistantObj;
                              const assistantName =
                                assistant.first_name && assistant.last_name
                                  ? `${assistant.last_name} ${assistant.first_name}`.trim()
                                  : assistant.name || "Unknown Assistant";
                              const status = assistantObj.status || "pending";

                              return (
                                <Badge
                                  key={assistant._id || assistantIndex}
                                  variant="outline"
                                  className={`text-xs capitalize ${getBadgeStyles(status)}`}
                                >
                                  {assistantName}
                                </Badge>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {session.trainees && session.trainees.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                          {t("planningManagement.modal.traineesLabel")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {session.trainees.map((traineeObj, traineeIndex) => {
                            const trainee = traineeObj.trainee || traineeObj;
                            const traineeName =
                              trainee.first_name && trainee.last_name
                                ? `${trainee.last_name} ${trainee.first_name}`.trim()
                                : trainee.name || "Unknown Trainee";
                            const status = traineeObj.status || "pending";

                            return (
                              <Badge
                                key={trainee._id || traineeIndex}
                                variant="outline"
                                className={`text-xs capitalize ${getBadgeStyles(status)}`}
                              >
                                {traineeName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {planningData?.exams && planningData.exams.length > 0 && (
            <div className="space-y-6">
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("planningManagement.view.examsLabel", "Linked Exams")}
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {planningData.exams.map((exam, index) => {
                  const examName = exam.exam?.name || exam.exam_component?.name || "Unnamed Exam";
                  const teacher = exam.teacher;
                  const teacherName = teacher
                    ? `${teacher.last_name || ""} ${teacher.first_name || ""}`.trim()
                    : "N/A";
                  const teacherStatus = exam.teacher_status || "pending";
                  
                  return (
                    <div key={exam._id || index} className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 space-y-4 border dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">{examName}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                            {t("planningManagement.view.examTeacherLabel", "Supervisor / Teacher")}
                          </p>
                          {teacher ? (
                            <Badge variant="outline" className={`text-xs capitalize ${getBadgeStyles(teacherStatus)}`}>
                              {teacherName}
                            </Badge>
                          ) : (
                            <span className="text-sm text-gray-950 dark:text-gray-200">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {planningData?.practical_exams && planningData.practical_exams.length > 0 && (
            <div className="space-y-6">
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("planningManagement.view.practicalExamsLabel", "Practical Exams")}
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {planningData.practical_exams.map((exam, index) => {
                  const examName = exam.exam?.name || exam.exam_component?.name || "Unnamed Exam";
                  const examDate = exam.exam_date
                    ? formatTZ(exam.exam_date, "DD-MM-YYYY")
                    : "N/A";

                  return (
                    <div key={exam._id || index} className="bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 space-y-4 border dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 dark:text-white">{examName}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem
                          label={t("planningManagement.modal.practicalExamDate", "Practical exam date")}
                          value={examDate}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">
                            {t("exam.form.teachersLabel", "Teachers")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {exam.teachers?.map((tObj, tIdx) => {
                              const tUser = tObj.teacher || tObj;
                              const tName = tUser.first_name && tUser.last_name
                                ? `${tUser.last_name} ${tUser.first_name}`.trim()
                                : tUser.name || "Unknown Teacher";
                              const status = tObj.status || "pending";
                              return (
                                <Badge
                                  key={tUser._id || tIdx}
                                  variant="outline"
                                  className={`text-xs capitalize ${getBadgeStyles(status)}`}
                                >
                                  {tName}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {planningData?.venue && (
            <div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <InfoItem
                label={t("planningManagement.view.venueLabel")}
                value={planningData.venue}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-700 dark:text-white/70">
      {label}
    </p>
    <p className="text-base text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default ViewPlanning;
