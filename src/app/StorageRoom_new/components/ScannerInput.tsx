import { KeyboardEvent, RefObject } from "react";

interface ScannerInputProps {
  inputRef: RefObject<HTMLInputElement>;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}

const ScannerInput = ({ inputRef, onKeyDown, onBlur }: ScannerInputProps) => {
  return (
    <input
      ref={inputRef}
      type="text"
      autoFocus
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      className="absolute -top-96 left-0 opacity-0"
      aria-hidden="true"
    />
  );
};

export default ScannerInput;
