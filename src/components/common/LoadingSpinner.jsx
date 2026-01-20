

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3">
        <div className={`animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-primary dark:border-t-primary ${sizeClasses[size]}`}></div>
        {text && <span className="text-gray-600 dark:text-gray-300 font-medium">{text}</span>}
      </div>
    </div>
  );
};

export default LoadingSpinner;