import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "@/store/main";

interface IPost {
  uid: string;
  title: string;
  excerpt: string;
  thumbnail: string;
  author: {
    uid: string;
    name: string;
    profile_image: string;
  };
  publication_date: number;
  clap_count: number;
  tags: string[];
}

const UV_Homepage: React.FC = () => {
  // Access global authentication state from redux store
  const auth_state = useAppSelector((state) => state.global.auth_state);
  const navigate = useNavigate();

  // Read url query params for pagination settings
  const [searchParams] = useSearchParams();
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;

  // Local state variables
  const [posts, setPosts] = useState<IPost[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageLimit] = useState<number>(initialLimit);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ errorCode?: number; errorMessage?: string }>({});
  const [hasMore, setHasMore] = useState<boolean>(true);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Function to fetch posts from the backend
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/posts`, {
        params: { page: currentPage, limit: pageLimit },
      });
      const fetchedPosts = response.data as IPost[];
      if (currentPage === 1) {
        setPosts(fetchedPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...fetchedPosts]);
      }
      if (fetchedPosts.length < pageLimit) {
        setHasMore(false);
      }
    } catch (err: any) {
      setError({
        errorCode: err.response?.status || 500,
        errorMessage: err.response?.data?.message || "An error occurred while fetching posts",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch posts when currentPage changes (including initial mount)
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Infinite scroll: check if the user had scrolled near the bottom
  const handleScroll = () => {
    if (isLoading || !hasMore) return;
    if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 300) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  // Setup scroll event listener when component mounts; cleanup on unmount
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMore]);

  // Handle clap action on a post
  const handleClap = async (postUid: string) => {
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    try {
      await axios.post(
        `${apiBaseUrl}/api/claps`,
        { post_uid: postUid, increment: 1 },
        {
          headers: { Authorization: `Bearer ${auth_state.auth_token}` },
        }
      );
      // Optimistically update the clap count for the post in local state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.uid === postUid) {
            return { ...post, clap_count: post.clap_count + 1 };
          }
          return post;
        })
      );
    } catch (err) {
      console.error("Error while adding clap:", err);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">AI Startup Blogs</h1>
        {error.errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            Error: {error.errorMessage}
          </div>
        )}
        {posts.length === 0 && !isLoading && (
          <div className="text-center text-gray-600">No posts available.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.uid} className="bg-white rounded shadow p-4 flex flex-col">
              {post.thumbnail ? (
                <Link to={`/post/${post.uid}`}>
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                </Link>
              ) : (
                <Link to={`/post/${post.uid}`}>
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded mb-4">
                    <span className="text-gray-500">No image</span>
                  </div>
                </Link>
              )}
              <div className="flex-grow">
                <Link
                  to={`/post/${post.uid}`}
                  className="text-xl font-semibold text-blue-600 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="text-gray-700 mt-2">{post.excerpt}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <span>{new Date(post.publication_date).toLocaleDateString()}</span>
                  <span> · {post.author.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleClap(post.uid)}
                    className="text-gray-600 hover:text-blue-600 flex items-center"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10h4l3-6 3 6h4v6h-4l-3 6-3-6H2v-6z" />
                    </svg>
                    <span className="ml-1">{post.clap_count}</span>
                  </button>
                </div>
              </div>
              <div className="mt-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/tag/${tag}`}
                    className="text-sm text-blue-500 hover:underline mr-2"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        {isLoading && (
          <div className="text-center mt-6">
            <span>Loading...</span>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_Homepage;