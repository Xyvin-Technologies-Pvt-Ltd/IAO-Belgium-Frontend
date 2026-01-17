import { X, Eye, Download, Flag, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const ViewApplication = ({ open, onClose, applicationId }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-start gap-4">
            <img
              src="https://i.pravatar.cc/100?img=12"
              alt="Applicant"
              className="w-16 h-16 rounded-full object-cover"
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-dashboard-text">
                  Jamie McCarthy
                </h2>
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-[6px] bg-[#DBA91C] text-white">
                  Pending
                </span>
              </div>
              <p className="text-sm font-medium">AP-101</p>
            </div>
          </div>

          <button onClick={onClose}>
            <X className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text">
              Basic info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <InfoItem label="Phone number" value="+910 23 665 XXXX" />
              <InfoItem label="Email Address" value="jamiemccarthy@gmail.com" />
              <InfoItem label="Previous education" value="MBA" />
              <InfoItem label="Course" value="Msc Osteopathy" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text">
              Attached Documents
            </h3>

            <DocumentRow title="ID proof.pdf" size="245 KB" />
            <DocumentRow title="Qualification Certificate.pdf" size="245 KB" />
          </div>

          <div>
            <h3 className="text-base font-semibold mb-4 text-dashboard-text">
              Actions
            </h3>

            <div className="flex items-center gap-3 mb-4">
              <Switch id="request-info" />
              <label htmlFor="request-info" className="text-sm cursor-pointer">
                Request additional information
              </label>
            </div>

            <div className="space-y-2">
              <label>Remarks</label>
              <Textarea
                placeholder="Enter any remarks to add before forwarding"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <Button variant="secondary">Reject</Button>
          <Button variant="secondary">Waitlist</Button>
          <Button>Accept</Button>
        </div>
      </div>
    </div>
  );
};

export default ViewApplication;

const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-base font-semibold text-dashboard-text">{value}</p>
  </div>
);

const DocumentRow = ({ title, size }) => (
  <div className="flex items-center justify-between border rounded-lg px-4 py-3 mb-3">
    <div className="flex items-center gap-3">
      <FileText size={18} className="text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold text-dashboard-text">{title}</p>
        <p className="text-xs text-muted-foreground">{size}</p>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <Action icon={Eye} label="View" />
      <Action icon={Download} label="Download" />
      <Action icon={Flag} label="Flag document" />
    </div>
  </div>
);

const Action = ({ icon: Icon, label }) => (
  <button className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-black">
    <Icon size={16} />
    {label}
  </button>
);
