import { useBreadcrumb } from '@/context/BreadCrumbContext';
import { useLocation } from '@tanstack/react-router';
import { ChevronRight, Home } from 'lucide-react';

export function AppBreadcrumbs() {
  const location = useLocation();
  const { breadcrumbs } = useBreadcrumb();

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
    return { label, path };
  });

  const displayBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      
      {displayBreadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {index === displayBreadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <a href={crumb.path} className="hover:text-foreground transition-colors">
              {crumb.label}
            </a>
          )}
        </div>
      ))}
    </nav>
  );
}