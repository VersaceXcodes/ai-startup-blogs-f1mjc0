import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const UV_ForgotPassword: React.FC = () => {
  // State variables for email input, loading state, and feedback message
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");

  // Base API URL, using VITE_API_BASE_URL environment variable if available
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Handler for form submission
  const submitPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check if email field is not empty
    if (!email) {
      setFeedbackMessage("Please enter your registered email address.");
      return;
    }
    setIsLoading(true);
    setFeedbackMessage(""); // Clear previous messages
    try {
      // POST request to initiate password reset
      await axios.post(`${API_BASE_URL}/api/password_resets`, { user_email: email });
      setFeedbackMessage("Password reset instructions have been sent to your email.");
    } catch (error: any) {
      // Display error message if POST request fails
      let errorMessage = "An error occurred. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      setFeedbackMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
        <h2 className="text-2xl font-bold mb-4">Password Recovery</h2>
        <p className="text-gray-600 mb-4">
          Enter your registered email address below. We will send you an email with instructions to reset your password.
        </p>
        {feedbackMessage && (
          <div className="mb-4 p-3 rounded bg-green-100 text-green-700">
            {feedbackMessage}
          </div>
        )}
        <form onSubmit={submitPasswordReset}>
          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 p-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Remembered your password?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Go back to Login
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_ForgotPassword;