import React from "react";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>
(({ className, ...props }, ref) => {
  return (
    <input
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";