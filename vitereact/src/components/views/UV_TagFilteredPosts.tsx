import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

interface IPost {
  uid: string;
  title: string;
  content: string;
  featured_image?: string;
  status: string;
  author_uid: string;
  tags: string[];
  created_at: number;
  updated_at: number;
}

const UV_TagFilteredPosts: React.FC = () => {
  const { tag_uid } = useParams<{ tag_uid: string }>();
  const [activeTag, setActiveTag] = useState<string>("");
  const [filteredPosts, setFilteredPosts] = useState<IPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (tag_uid) {
      setActiveTag(tag_uid);
      fetchFilteredPosts(tag_uid);
    }
  }, [tag_uid]);

  const fetchFilteredPosts = async (tag: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/posts?tag=${tag}`
      );
      setFilteredPosts(response.data);
    } catch (error) {
      console.error("Error fetching filtered posts", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Posts tagged with "{activeTag}"
          </h1>
          <Link to="/" className="text-blue-500 hover:underline">
            Clear Filter
          </Link>
        </div>
        {isLoading ? (
          <div className="text-center text-lg font-medium">Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            No posts found for tag "{activeTag}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.uid}
                className="border rounded shadow hover:shadow-lg transition duration-200 p-4"
              >
                <Link to={`/post/${post.uid}`}>
                  {post.featured_image && (
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded mb-4"
                    />
                  )}
                  <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                  <p className="text-gray-700 mb-2">
                    {post.content.length > 100
                      ? post.content.substring(0, 100) + "..."
                      : post.content}
                  </p>
                  <p className="text-sm text-gray-500">
                    Posted on{" "}
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UV_TagFilteredPosts;