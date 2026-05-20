import * as React from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

const CustomPhoneInput = React.forwardRef(({ 
  className, 
  error, 
  whiteBg = true,
  ...props 
}, ref) => {
  return (
    <PhoneInput
      ref={ref}
      className={cn(
        "placeholder:text-muted-foreground file:text-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-[6px] border-[0.5px] px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        whiteBg ? "bg-white" : "bg-input-foreground",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        error && "aria-invalid:true border-destructive",
        className
      )}
      countrySelectProps={{
        className: "border-0 bg-transparent focus:ring-0 focus:outline-none text-base md:text-sm"
      }}
      numberInputProps={{
        className: "border-0 bg-transparent focus:ring-0 focus:outline-none flex-1 ml-2 text-base md:text-sm placeholder:text-muted-foreground"
      }}
      {...props}
    />
  );
});

CustomPhoneInput.displayName = "PhoneInput";

export { CustomPhoneInput as PhoneInput };
