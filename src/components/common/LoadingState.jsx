
import LoadingSpinner from './LoadingSpinner';

const LoadingState = ({ 
  text = 'Loading...', 
  size = 'md', 
  fullHeight = false,
  className = '' 
}) => {
  const heightClass = fullHeight ? 'min-h-[200px]' : 'py-8';
  
  return (
    <div className={`${heightClass} ${className}`}>
      <LoadingSpinner size={size} text={text} />
    </div>
  );
};

export default LoadingState;