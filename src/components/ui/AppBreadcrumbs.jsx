import { useBreadcrumb } from '@/context/BreadCrumbContext';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';

export function AppBreadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { breadcrumbs } = useBreadcrumb();

  // Helper function to check if a breadcrumb segment is a non-navigable parent
  const isNonNavigableParent = (segment) => {
    const nonNavigableParents = [
      'program-administration',
      'admission-administration'
    ];
    return nonNavigableParents.includes(segment.toLowerCase());
  };

  // Generate breadcrumbs from pathname if custom breadcrumbs are not set
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Filter out role-based segments (admin, teacher, student)
  const rolesToExclude = ['admin', 'teacher', 'student'];
  const filteredSegments = pathSegments.filter(segment => 
    !rolesToExclude.includes(segment.toLowerCase())
  );
  
  const defaultBreadcrumbs = filteredSegments.map((segment, index) => {
    // Reconstruct path with original segments for navigation
    const originalIndex = pathSegments.indexOf(segment);
    const path = '/' + pathSegments.slice(0, originalIndex + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    // Check if this segment is a non-navigable parent
    const navigable = !isNonNavigableParent(segment);
    
    return { label, path, navigable };
  });

  const handleBreadcrumbClick = (path) => {
    navigate({ to: path });
  };

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground min-w-0 overflow-hidden">
      {displayBreadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center min-w-0">
          <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
          {index === displayBreadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium truncate">
              {crumb.label}
            </span>
          ) : crumb.navigable !== false ? (
            <button 
              onClick={() => handleBreadcrumbClick(crumb.path)} 
              className="hover:text-foreground transition-colors cursor-pointer truncate"
              title={crumb.label}
            >
              <span className="hidden sm:inline">{crumb.label}</span>
              <span className="sm:hidden">...</span>
            </button>
          ) : (
            <span className="text-muted-foreground truncate" title={crumb.label}>
              <span className="hidden sm:inline">{crumb.label}</span>
              <span className="sm:hidden">...</span>
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}