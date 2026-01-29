
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import moment from "moment";

const ViewPlanning = ({ open, onClose, planningData }) => {
  const { t } = useTranslation();

  if (!open || !planningData) return null;

  // Helper function to get badge variant based on teacher status
  const getBadgeVariant = (status) => {
    switch (status) {
      case 'accepted':
        return 'default'; // Green background
      case 'rejected':
        return 'destructive'; // Red background
      case 'pending':
      default:
        return 'secondary'; // Gray background
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-black w-full max-w-2xl rounded-xl shadow-lg overflow-hidden border dark:border-white/20 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b dark:border-white/20">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('planningManagement.view.moduleLabel')}: {planningData?.component?.name || 'N/A'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground dark:text-white/70 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <InfoItem 
              label={t('planningManagement.view.programLabel')} 
              value={planningData?.component?.program?.name || 'N/A'} 
            />
            <InfoItem 
              label={t('planningManagement.view.batchLabel')} 
              value={planningData?.batch?.name || 'N/A'} 
            />
            {planningData?.description && (
              <InfoItem 
                label={t('planningManagement.view.descriptionLabel')} 
                value={planningData.description} 
              />
            )}
          </div>

          {/* Sessions */}
          {planningData?.sessions && planningData.sessions.length > 0 && (
            <div className="space-y-6">
              {planningData.sessions.map((session, index) => (
                <div key={session._id || index}>
                  {index > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
                  )}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('planningManagement.view.sessionLabel')} {index + 1}
                    </h3>
                    
                    <InfoItem 
                      label={t('planningManagement.view.sessionNameLabel')} 
                      value={session.name || 'N/A'} 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoItem 
                        label={t('planningManagement.view.dateLabel')} 
                        value={session.session_date ? moment(session.session_date).format('YYYY-MM-DD') : 'N/A'} 
                      />
                      <InfoItem 
                        label={t('planningManagement.view.timeFromLabel')} 
                        value={session.start_time ? moment(session.start_time, 'HH:mm').format('h:mm A') : 'N/A'} 
                      />
                      <InfoItem 
                        label={t('planningManagement.view.timeTillLabel')} 
                        value={session.end_time ? moment(session.end_time, 'HH:mm').format('h:mm A') : 'N/A'} 
                      />
                    </div>

                    {/* Teachers for this session */}
                    {session.teachers && session.teachers.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-2">{t('planningManagement.view.teachersLabel')}</p>
                        <div className="flex flex-wrap gap-2">
                          {session.teachers.map((teacherObj, teacherIndex) => {
                            const teacher = teacherObj.teacher || teacherObj;
                            const teacherName = teacher.first_name && teacher.last_name 
                              ? `${teacher.first_name} ${teacher.last_name}`.trim()
                              : teacher.name || 'Unknown Teacher';
                            const status = teacherObj.status || 'pending';
                            
                            return (
                              <Badge 
                                key={teacher._id || teacherIndex} 
                                variant={getBadgeVariant(status)}
                                className="text-xs"
                              >
                                {teacherName}
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

          {/* Venue */}
          {planningData?.venue && (
            <div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>
              <InfoItem 
                label={t('planningManagement.view.venueLabel')} 
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
    <p className="text-sm font-medium text-gray-700 dark:text-white/70">{label}</p>
    <p className="text-base text-gray-900 dark:text-white">{value}</p>
  </div>
);

export default ViewPlanning;
