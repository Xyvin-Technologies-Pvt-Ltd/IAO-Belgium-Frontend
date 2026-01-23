import { X, FileText, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import moment from "moment";

const ViewComponent = ({ open, onClose, componentData }) => {
  if (!open || !componentData) return null;

  const getTypeLabel = (type) => {
    const typeLabels = {
      module: "Module",
      app: "Application",
      resource: "Resource",
      exam: "Exam"
    };
    return typeLabels[type] || type;
  };

  const handleView = (file) => {
    // Open file in new tab
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-black border rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">
              {componentData.name} - {componentData.uid}
            </h2>
            <p className="text-sm text-muted-foreground">
              {getTypeLabel(componentData.type)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Year</h3>
              <p className="text-lg">{componentData.year}</p>
            </div>
            
            {componentData.submission_deadline && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Submission Deadline</h3>
                <p className="text-lg">{moment(componentData.submission_deadline).format("DD-MM-YYYY")}</p>
              </div>
            )}

            {componentData.amount !== undefined && componentData.type === "module" && (
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Amount</h3>
                <p className="text-lg">
                  {componentData.currency 
                    ? `${componentData.currency} ${componentData.amount || 0}`
                    : componentData.amount || 0
                  }
                </p>
              </div>
            )}
          </div>

          {componentData.instruction && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-2">Instructions</h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm leading-relaxed">{componentData.instruction}</p>
              </div>
            </div>
          )}
          {componentData.files && componentData.files.length > 0 && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {componentData.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-700 dark:text-white truncate">{file.name}</p>
                      </div>
                    </div>
                    <button 
                      className="flex items-center gap-1 text-sm font-semibold text-muted-foreground dark:text-white/70 hover:text-black dark:hover:text-white"
                      onClick={() => handleView(file)}
                    >
                      <Eye className="h-4 w-4" />
                   
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {componentData.submissions && componentData.type === "app" && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Submissions</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {componentData.submissions.case_studies ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Case studies</span>
                </div>
                <div className="flex items-center gap-2">
                  {componentData.submissions.essays ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Essays</span>
                </div>
                <div className="flex items-center gap-2">
                  {componentData.submissions.internships ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">Internships</span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${componentData.status ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {componentData.status ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewComponent;