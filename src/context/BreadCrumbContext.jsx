import React, { createContext, useContext, useState } from 'react';

const BreadcrumbContext = createContext();

export const useBreadcrumb = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};

export const BreadcrumbProvider = ({ children }) => {
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [hasCustomBreadcrumbs, setHasCustomBreadcrumbs] = useState(false);

  const updateBreadcrumbs = (newBreadcrumbs) => {
    setBreadcrumbs(newBreadcrumbs);
    setHasCustomBreadcrumbs(newBreadcrumbs.length > 0);
  };

  return (
    <BreadcrumbContext.Provider value={{ breadcrumbs, updateBreadcrumbs, hasCustomBreadcrumbs }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};