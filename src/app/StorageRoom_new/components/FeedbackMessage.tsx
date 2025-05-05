import { useEffect, useState } from "react";
import { FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

interface FeedbackMessageProps {
  message: string;
  error: string;
}

const FeedbackMessage = ({ message, error }: FeedbackMessageProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message || error) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [message, error]);

  if (!message && !error) return null;

  return (
    <div
      className={`mt-6 transition-all duration-300 transform ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          <FaExclamationTriangle className="flex-shrink-0 text-red-500" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      {message && (
        <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
          <FaCheckCircle className="flex-shrink-0 text-green-500" />
          <p className="font-medium">{message}</p>
        </div>
      )}
    </div>
  );
};

export default FeedbackMessage;
