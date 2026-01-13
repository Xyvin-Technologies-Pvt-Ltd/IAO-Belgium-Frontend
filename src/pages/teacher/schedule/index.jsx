import { useState } from "react";
import GridView from "./GridView";
import ListView from "./ListView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LayoutGrid, List } from "lucide-react";

const Schedules = () => {
  const [view, setView] = useState("list");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold ">Schedules</h2>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input placeholder="Search Sessions" whiteBg className="max-w-sm" />
        <div className="flex items-center gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {view === "grid" ? <GridView /> : <ListView />}
    </div>
  );
};

export default Schedules;
