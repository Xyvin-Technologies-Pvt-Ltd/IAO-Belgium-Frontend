import React from "react";

const Shimmer = ({ className }) => (
  <div
    className={`relative overflow-hidden bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse ${className}`}
  />
);

const TableSkeleton = ({ rows = 5, columns = 8 }) => {
  const getRandomWidth = () => {
    const widths = ["w-8", "w-12", "w-16", "w-20", "w-24"];
    return widths[Math.floor(Math.random() * widths.length)];
  };

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="hover:bg-gray-50 border-b border-gray-200">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="py-4 px-4">
              <Shimmer className={`${getRandomWidth()} h-4 rounded`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
