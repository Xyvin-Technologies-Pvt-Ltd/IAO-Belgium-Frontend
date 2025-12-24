import ActionCard from "@/components/student/ActionCard";

const ExamList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ActionCard
        indexLabel="Exam 1"
        title="Exam for Foot and Knee"
        status="completed"
        onViewDetails={() => console.log("view")}
      />

      <ActionCard
        indexLabel="Exam 2"
        title="Exam for Foot and Knee"
        status="available"
        onPrimaryAction={() => console.log("start")}
      />

      <ActionCard indexLabel="Exam 3" title="Exam for Foot and Knee" status="locked" />
    </div>
  );
};

export default ExamList;
