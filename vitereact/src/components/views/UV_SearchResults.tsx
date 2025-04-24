import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

const UV_SearchResults: React.FC = () => {
  // Retrieve query params from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialLimit = parseInt(searchParams.get("limit") || "10");

  // Define state variables as per the datamap
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [resultsPerPage, setResultsPerPage] = useState<number>(initialLimit);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get the API base URL from environment variables
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Function to execute the search by interfacing with the backend
  const performSearch = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/posts`, {
        params: {
          search: searchQuery,
          page: currentPage,
          limit: resultsPerPage,
        },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to trigger search when the URL parameters change.
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    setSearchQuery(q);
    setCurrentPage(page);
    setResultsPerPage(limit);
    if (q) {
      performSearch();
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Handle submission of the search form to refine the query
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, page: "1", limit: resultsPerPage.toString() });
  };

  // Pagination handlers to navigate pages
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setSearchParams({
        q: searchQuery,
        page: (currentPage - 1).toString(),
        limit: resultsPerPage.toString(),
      });
    }
  };

  const goToNextPage = () => {
    setSearchParams({
      q: searchQuery,
      page: (currentPage + 1).toString(),
      limit: resultsPerPage.toString(),
    });
  };

  // Helper function to highlight occurrences of the search query in text
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200">
          {part}
        </span>
      ) : (
        <span key={index}>{part}</span>
      )
    );
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Search Results</h1>

        <form onSubmit={handleSearchSubmit} className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="border rounded p-2 w-full"
          />
          <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Search
          </button>
        </form>

        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            {searchResults.length === 0 ? (
              <div>No results found for "{searchQuery}"</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((post: any) => (
                  <Link
                    key={post.uid}
                    to={`/post/${post.uid}`}
                    className="border rounded p-4 hover:shadow-lg"
                  >
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-48 object-cover mb-2"
                      />
                    )}
                    <h2 className="text-xl font-semibold">
                      {highlightText(post.title, searchQuery)}
                    </h2>
                    <p className="text-gray-600 mt-2">
                      {highlightText(post.content.substring(0, 100) + "...", searchQuery)}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Published on {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex justify-between mt-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center">Page {currentPage}</span>
          <button
            onClick={goToNextPage}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default UV_SearchResults;