//* Extracted from the pattern every *FilterDrawer.jsx duplicates locally
//* (StudentFilterDrawer, ResultsFilterDrawer, ...) — shared here across the
//* archive drawers only; the existing 10 are left as-is.
const FilterSection = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/60">
      {label}
    </label>
    {children}
  </div>
);

export default FilterSection;
