import Breadcrumb from "@/components/common/BreadCrumb";
import { useParams } from "@tanstack/react-router";
import ModuleCard from "@/components/student/ModuleCard";
import LocationCard from "@/components/student/LocationCard";
import { CircleAlert } from "lucide-react";

const ChangeLocation = () => {
  const params = useParams({ strict: false });
  const id = params.id;
  const modules = [
    {
      id: 1,
      title: "Osteopathic Principles+The Iliosacral Joint",
      tutor: "Dr. Sarah Mitchell",
      date: "March 15-17, 2024",
      time: "Daily: 14:00 - 18:00",
      location: "Brussels Campus, Rue de la Loi 123, 1040 Brussels",
    },
  ];

  const locations = [
    {
      id: 1,
      date: "March 15–17, 2024",
      campus: "Brussels Campus",
      seats: 4,
      tutor: "Dr. Sarah Mitchell",
      time: "Daily: 14:00 – 18:00",
      isAvailable: true,
    },
    {
      id: 2,
      date: "March 15–17, 2024",
      campus: "Brussels Campus",
      seats: 4,
      tutor: "Dr. Sarah Mitchell",
      time: "Daily: 14:00 – 18:00",
      isAvailable: true,
    },
    {
      id: 3,
      date: "May 10–12, 2024",
      campus: "Brussels Campus",
      seats: 5,
      tutor: "Ms. Emily Tran",
      time: "Daily: 09:00 – 13:00",
      isAvailable: true,
    },
    {
      id: 4,
      date: "April 5–7, 2024",
      campus: "Brussels Campus",
      seats: 0,
      tutor: "Prof. John Reynolds",
      time: "Daily: 10:00 – 14:00",
      isAvailable: false,
    },
  ];

  return (
    <div className="space-y-10 px-5 lg:px-15 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/student/dashboard" },
          { label: "Module details", href: `/student/module/${id}` },
          { label: "Change location" },
        ]}
      />
      <div className="space-y-4">
        <h2 className="text-xl">Your current Booking</h2>
        <ModuleCard modules={modules} changeLocation />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl">
          Choose an alternative session that fits your schedule
        </h2>
        <div className="flex items-start gap-3 rounded-[6px] bg-[#FF8904]/10 px-2 py-2 text-sm text-[#A75800]">
          <span className="mt-0.5">
            <CircleAlert size={16} />
          </span>
          <p>
            We’ll approve your request if a slot is available; otherwise, you’ll
            continue with your booked module. If you can’t attend, just let the
            authority know.
          </p>
        </div>
        <div className="space-y-5">
          {locations.map((module) => (
            <LocationCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChangeLocation;
