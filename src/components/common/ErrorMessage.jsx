
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

const ErrorMessage = ({ 
  message = 'Something went wrong', 
  onRetry, 
  showRetry = true,
  className = '',
  variant = 'default' // 'default', 'inline', 'card'
}) => {
  const baseClasses = "flex items-center justify-center text-red-600";
  
  const variantClasses = {
    default: "p-4 bg-red-50 border border-red-200 rounded-lg",
    inline: "p-2",
    card: "p-6 bg-white border border-red-200 rounded-xl shadow-sm"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;