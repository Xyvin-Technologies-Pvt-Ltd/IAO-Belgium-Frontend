
import ListCard from "@/components/student/ListCard";

const certificatesData = [
  {
    id: 1,
    name: "Foot Exam Certificate",
    size: "23 MB",
  },
  {
    id: 2,
    name: "Knee Exam Certificate",
    size: "23 MB",
  },
];

const Certificates = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Year 1</h2>

        <button className="text-sm text-[#0088FF] font-bold underline">
          Download All
        </button>
      </div>

      <ListCard
        columns={["Exam Name", "File Size", "Action"]}
        data={certificatesData}
        onDownload={(item) =>
          console.log("Download", item.name)
        }
      />
    </div>
  );
};

export default Certificates;
