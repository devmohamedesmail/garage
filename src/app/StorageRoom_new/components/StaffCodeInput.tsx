import { ChangeEvent, useState } from "react";
import { FaUserShield } from "react-icons/fa";

interface StaffCodeInputProps {
  staffCode: string;
  onChange: (value: string) => void;
}

const StaffCodeInput = ({ staffCode, onChange }: StaffCodeInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        Staff Code
      </label>
      <div
        className={`relative flex items-center border ${
          isFocused ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
        } rounded-lg overflow-hidden transition-all duration-200`}
      >
        <span className="pl-3 text-gray-500">
          <FaUserShield />
        </span>
        <input
          id="staffCodeInput"
          type="password"
          value={staffCode}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter your staff code"
          className="w-full p-3 focus:outline-none bg-transparent"
        />
        {staffCode && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="pr-3 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default StaffCodeInput;
