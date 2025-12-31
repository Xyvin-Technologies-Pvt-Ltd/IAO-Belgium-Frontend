import { schedules } from "@/assets/data/schedule";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/table/Pagination";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useState } from "react";
import { Calendar, Clock, MapPin, Globe, FileText } from "lucide-react";

const GridView = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(3);
  const [isLoading] = useState(false);
  const [error] = useState(null);

  const totalRows = schedules.length;

  if (isLoading) {
    return <LoadingState text="Loading schedules..." fullHeight />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error?.message || "Failed to load schedules"}
        variant="card"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {schedules.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-[#ECECEC] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-[6px] bg-[#F1F5F9] flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#418FFF]" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-dashboard-text">{item.title}</h3>

                  <div className="flex items-center gap-2 mt-1 text-base text-dashboard-text">
                    <span>{item.course}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[#F2F2F2]">
                      {item.code}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" >
                  View
                </Button>
                <Button variant="secondary" >
                  Add to Calendar
                </Button>
                <Button >
                  Mark attendance
                </Button>
              </div>
            </div>

            <div className="my-4 h-px bg-[#ECECEC]" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Detail
                icon={<Calendar className="h-4 w-4 text-primary" />}
                label="Date"
                value={item.date}
              />
              <Detail
                icon={<Clock className="h-4 w-4 text-primary" />}
                label="Time"
                value={item.time}
              />
              <Detail
                icon={<MapPin className="h-4 w-4 text-primary" />}
                label="Location"
                value={item.location}
              />
              <Detail
                icon={<Globe className="h-4 w-4 text-primary" />}
                label="Language"
                value={item.language}
              />
            </div>
          </div>
        ))}
      </div>
      <Pagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalRows={totalRows}
      />
    </div>
  );
};

export default GridView;

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    {icon}
    <div>
      <p className="text-sm text-muted-foreground font-semibold">{label}</p>
      <p className="font-semibold text-base">{value}</p>
    </div>
  </div>
);
