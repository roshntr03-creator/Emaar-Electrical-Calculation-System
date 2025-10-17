
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  id: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <select
        id={id}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default Select;
