import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/main";

const GV_TopNav: React.FC = () => {
  // Local state definitions for search query and hamburger menu toggle.
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState<boolean>(false);

  const navigate = useNavigate();
  // Access global authentication state from the Redux store.
  const auth_state = useAppSelector((state) => state.global.auth_state);
  const app_notifications = useAppSelector((state) => state.global.app_notifications);

  // Handle the search form submission.
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      if (isHamburgerMenuOpen) setIsHamburgerMenuOpen(false);
    }
  };

  // Toggle the mobile hamburger menu state.
  const toggleHamburgerMenu = () => {
    setIsHamburgerMenuOpen(!isHamburgerMenuOpen);
  };

  const isAuthenticated = auth_state.is_authenticated;

  return (
    <>
      <header className="bg-white shadow fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo / Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-800">
                AI Startup Blogs
              </Link>
            </div>

            {/* Center: Global Search Bar */}
            <div className="flex-1 flex items-center justify-center">
              <form onSubmit={handleSearchSubmit} className="w-full max-w-lg">
                <label htmlFor="global_search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <input
                    id="global_search"
                    name="global_search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search posts..."
                  />
                  <button
                    type="submit"
                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                  >
                    <span className="text-gray-500">Search</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-500">
                Home
              </Link>
              <Link to="/search" className="text-gray-700 hover:text-blue-500">
                Explore
              </Link>
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-blue-500">
                    Sign In
                  </Link>
                  <Link to="/register" className="text-gray-700 hover:text-blue-500">
                    Sign Up
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Link to="/editor" className="text-gray-700 hover:text-blue-500">
                    New Post
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-blue-500">
                    Profile
                  </Link>
                  <div className="relative">
                    <button className="text-gray-700 hover:text-blue-500 focus:outline-none">
                      <span role="img" aria-label="Notifications">
                        🔔
                      </span>
                      {app_notifications.length > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {app_notifications.length}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile: Hamburger Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={toggleHamburgerMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-500 hover:bg-gray-200 focus:outline-none focus:bg-gray-200"
              >
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {isHamburgerMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation Menu */}
        {isHamburgerMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                to="/"
                onClick={() => setIsHamburgerMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Home
              </Link>
              <Link
                to="/search"
                onClick={() => setIsHamburgerMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Explore
              </Link>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsHamburgerMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsHamburgerMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sign Up
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/editor"
                    onClick={() => setIsHamburgerMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    New Post
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsHamburgerMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => setIsHamburgerMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Notifications{" "}
                    {app_notifications.length > 0 && (
                      <span className="ml-1 text-red-600">
                        ({app_notifications.length})
                      </span>
                    )}
                  </button>
                </>
              )}
              <form onSubmit={handleSearchSubmit} className="px-3 py-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="block w-full border border-gray-300 rounded-md py-2 pl-3 pr-10 leading-5 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </form>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default GV_TopNav;