import Breadcrumb from "@/components/common/BreadCrumb";
import AppCard from "@/components/student/AppCard";
import InstructionCard from "@/components/student/InstructionCard";
import ListCard from "@/components/student/ListCard";

const AppDetails = () => {
  const courseMaterials = [
    {
      id: 1,
      name: "Assignments",
      size: "23 MB",
    },
    {
      id: 2,
      name: "Case study",
      size: "23 MB",
    },
    {
      id: 3,
      name: "Internship",
      size: "23 MB",
    },
  ];
  const appData = {
    title: "Applied Professional Practice-Year 1",
    deadline: "January 15th, 2025",
    status: "Ongoing",
    downloadableCount: 3,
    progress: 50,
    showVideo: true,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  };
  const instructionData = {
    description: "Our expert educators are reviewing:",
    points: [
      "Your registration details",
      "Your proof of prior experience",
      "Your video submissions",
    ],
    email: "maria@example.com",
  };

  return (
    <div className="space-y-10 px-5 lg:px-15 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/student/dashboard" },
          { label: "App details" },
        ]}
      />
      <AppCard data={appData} />
      <InstructionCard data={instructionData} />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">Downloadable Guidelines &Templates</h2>

          <button className="text-sm font-semibold text-[#0088FF] underline">
            Download All
          </button>
        </div>

        <ListCard
          columns={["File Name", "File Size", "Action"]}
          data={courseMaterials}
          onDownload={(item) => console.log("Download", item.name)}
        />
      </div>
    </div>
  );
};

export default AppDetails;
