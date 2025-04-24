import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/main";
import { set_auth_state } from "@/store/main";

const UV_Registration: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Function to perform inline validation on all fields
  const getValidationErrors = () => {
    const errors: { [key: string]: string } = {};
    if (!name.trim()) {
      errors.name = "Name is required";
    }
    if (!email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        errors.email = "Invalid email format";
      }
    }
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm Password is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  // Handler for input changes that updates state and validations
  const handleInputChange = (
    field: "name" | "email" | "password" | "confirmPassword",
    value: string
  ) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
    // Validate fields on every change
    const errors = getValidationErrors();
    setValidationErrors(errors);
    setApiError("");
  };

  // Handler for blur events to perform validation
  const handleBlur = () => {
    const errors = getValidationErrors();
    setValidationErrors(errors);
  };

  // Handler for form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Perform final validations before submitting
    const errors = getValidationErrors();
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setIsSubmitting(true);
    setApiError("");
    try {
      const response = await axios.post(
        "http://localhost:1337/api/users/register",
        {
          name,
          email,
          password
        }
      );
      // Assume response.data is the AuthResponse with token and user details
      dispatch(set_auth_state(response.data));
      setSuccessMessage("Registration successful!");
      // Redirect to profile setup screen
      navigate("/profile/edit");
    } catch (error: any) {
      // Handle error and display an appropriate message
      if (error.response && error.response.data && error.response.data.message) {
        setApiError(error.response.data.message);
      } else {
        setApiError("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">User Registration</h1>
        {apiError && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 border border-red-400 rounded">
            {apiError}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 border border-green-400 rounded">
            {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              onBlur={handleBlur}
              placeholder="John Doe"
              className="mt-1 p-2 border rounded w-full"
            />
            {validationErrors.name && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={handleBlur}
              placeholder="example@example.com"
              className="mt-1 p-2 border rounded w-full"
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              onBlur={handleBlur}
              placeholder="Enter your password"
              className="mt-1 p-2 border rounded w-full"
            />
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>
          <div className="mb-4">
            <label htmlFor="confirmPassword" className="block text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              onBlur={handleBlur}
              placeholder="Re-enter your password"
              className="mt-1 p-2 border rounded w-full"
            />
            {validationErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold p-2 rounded"
          >
            {isSubmitting ? "Submitting..." : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 underline">
            Sign In
          </Link>
        </p>
      </div>
    </>
  );
};

export default UV_Registration;