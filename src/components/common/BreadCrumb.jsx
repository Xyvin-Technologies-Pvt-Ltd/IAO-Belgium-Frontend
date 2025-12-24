import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

const Breadcrumb = ({ items = [] }) => {
  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-2 font-semibold text-base">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {index !== 0 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}

            {item.href ? (
              <Link to={item.href} className="hover:text-primary transition">
                {item.label}
              </Link>
            ) : (
              <span className="text-primary font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
      <div className="border-b border-muted-foreground" />
    </div>
  );
};

export default Breadcrumb;
