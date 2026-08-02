import { useMemo, useState } from "react";

//* Client-side sort for a detail sub-table whose whole array already arrived
//* in one response (ProgrammeDetail modules/cohorts, CohortDetail
//* sessions/students, InvoiceDetail lines, the entities index). No backend
//* round trip — sort params are deliberately NOT sent to these endpoints.
//*
//* `accessors` maps a sort key to a function pulling the comparable value out
//* of a row, e.g. { name: (row) => row.full_name }.
export const useClientTableSort = (rows, { defaultKey, defaultOrder = "asc", accessors }) => {
  const [sortBy, setSortBy] = useState(defaultKey);
  const [sortOrder, setSortOrder] = useState(defaultOrder);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const sorted = useMemo(() => {
    const accessor = accessors[sortBy];
    if (!accessor || !rows) return rows || [];

    const dir = sortOrder === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);

      //* Nulls last in BOTH directions, mirroring the server's NULLS LAST —
      //* the two surfaces should behave identically to an admin.
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { sensitivity: "base" }) * dir;
    });
  }, [rows, sortBy, sortOrder, accessors]);

  return { sorted, sortBy, sortOrder, handleSort };
};
