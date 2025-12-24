import Breadcrumb from "@/components/common/BreadCrumb";
import { Button } from "@/components/ui/button";
import ListCard from "@/components/student/ListCard";
import InvoiceCard from "@/components/student/InvoiceCard";
import ModuleCard from "@/components/student/ModuleCard";

const ModuleDetails = () => {
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

  const courseMaterials = [
    {
      id: 1,
      name: "The iliosacral joint - Cremers.pdf",
      size: "23 MB",
    },
    {
      id: 2,
      name: "Palpation pelvis - Cremers.pdf",
      size: "23 MB",
    },
  ];

  return (
    <div className="space-y-10 px-6 lg:px-15 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/student/dashboard" },
          { label: "Module details" },
        ]}
      />
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-3xl font-semibold">
          Osteopathic Principles+The Iliosacral Joint
        </h1>

        <Button variant="outline">Add to Calendar</Button>
      </div>
      <ModuleCard modules={modules} showLocationChange={true} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Course Material</h2>

          <button className="text-sm font-semibold text-[#0088FF] underline">
            Download All
          </button>
        </div>

        <ListCard
          columns={["Course Name", "File Size", "Action"]}
          data={courseMaterials}
          onDownload={(item) => console.log("Download", item.name)}
        />
      </div>
      <div className="space-y-4">
        <h2 className="text-xl">Invoice</h2>
        <InvoiceCard
          status="paid"
          amount={250}
          onDownload={() => console.log("Download disabled")}
          onView={() => console.log("View invoice")}
        />
      </div>
    </div>
  );
};

export default ModuleDetails;
