import ProgressCard from "@/components/student/ProgressCard";

const MyCourses = () => {
  return (
    <div className="px-5 lg:px-15 mx-auto space-y-8 py-10">
      <h2 className="text-xl">Your Journey</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressCard
          title="Overall Progress"
          totalLabel="40 Modules"
          completed={2}
          total={40}
        />

        <ProgressCard
          title="Current Year (Year 1)"
          totalLabel="9 Modules"
          completed={2}
          total={9}
          message="Great! You've completed 2 modules 7 more to go this year"
        />
      </div>
    </div>
  );
};

export default MyCourses;
