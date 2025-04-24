import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/main";
import { set_auth_state, set_global_loading, set_error_state, clear_error_state } from "@/store/main";

const UV_Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Local state variables as per datamap
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setValidationErrors({});
    
    // Basic validation for email and password
    const errors: { email?: string; password?: string } = {};
    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    dispatch(set_global_loading(true));
    
    try {
      // Call backend API using the URL from VITE_API_BASE_URL environment variable
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/login`,
        { email, password }
      );
      
      // Destructure token and user object from response data
      const { token, user } = response.data;
      
      // Update global auth state after successful login
      dispatch(set_auth_state({
        is_authenticated: true,
        auth_token: token,
        user: user
      }));
      
      // Clear any global error state if needed
      dispatch(clear_error_state());
      
      // Redirect user to the homepage after login
      navigate("/");
    } catch (error: any) {
      // If an error response is available, extract the message
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
        dispatch(set_error_state({ 
          errorCode: error.response.status, 
          errorMessage: error.response.data.message 
        }));
      } else {
        setErrorMsg("Login failed. Please check your credentials and try again.");
        dispatch(set_error_state({ 
          errorCode: 500, 
          errorMessage: "Login failed. Please check your credentials and try again." 
        }));
      }
    } finally {
      setIsSubmitting(false);
      dispatch(set_global_loading(false));
    }
  };

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
          {errorMsg && (
            <div className="mb-4 text-red-500 text-center">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              />
              {validationErrors.password && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
              )}
            </div>
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="rememberMe" className="text-gray-700">Remember Me</label>
            </div>
            <div className="mb-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
          <div className="text-center">
            <Link to="/forgot-password" className="text-blue-500 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;