import { Label } from "../label";
import { Input } from "../input";

const FormField = ({
  label,
  error,
  required = false,
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label
          className={
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
          }
        >
          {label}
        </Label>
      )}
      {children || <Input {...props} />}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default FormField;
