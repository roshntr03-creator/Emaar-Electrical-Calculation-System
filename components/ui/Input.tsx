
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        id={id}
        className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
};

export default Input;
