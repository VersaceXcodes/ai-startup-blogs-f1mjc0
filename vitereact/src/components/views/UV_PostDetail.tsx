import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAppSelector } from "@/store/main";

interface Author {
  uid: string;
  name: string;
  profile_image: string;
  bio: string;
}

interface PostType {
  uid: string;
  title: string;
  content: string;
  featured_image: string;
  status: string;
  publication_date: number;
  clap_count: number;
  tags: string[];
  author: Author;
}

interface CommentUser {
  uid: string;
  name: string;
  profile_image: string;
}

interface CommentType {
  uid: string;
  user: CommentUser;
  content: string;
  created_at: number;
}

interface ErrorType {
  errorCode?: number;
  errorMessage?: string;
}

const UV_PostDetail: React.FC = () => {
  const { post_uid } = useParams<{ post_uid: string }>();
  const navigate = useNavigate();
  const auth_state = useAppSelector((state) => state.global.auth_state);

  const [post, setPost] = useState<PostType>({
    uid: "",
    title: "",
    content: "",
    featured_image: "",
    status: "",
    publication_date: 0,
    clap_count: 0,
    tags: [],
    author: {
      uid: "",
      name: "",
      profile_image: "",
      bio: "",
    },
  });
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType>({});
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `http://localhost:1337/api/posts/${post_uid}`
        );
        // Assuming the response data includes the post details and an array "comments"
        const data = response.data;
        setPost({
          uid: data.uid,
          title: data.title,
          content: data.content,
          featured_image: data.featured_image,
          status: data.status,
          publication_date: data.publication_date,
          clap_count: data.clap_count,
          tags: data.tags,
          author: data.author,
        });
        if (data.comments) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      } catch (err: any) {
        console.error(err);
        setError({
          errorCode: err.response?.status,
          errorMessage:
            err.response?.data?.message || "Error fetching post details",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostDetail();
  }, [post_uid]);

  const handleClap = async () => {
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    try {
      const body = { post_uid: post.uid, increment: 1 };
      const headers = { Authorization: `Bearer ${auth_state.auth_token}` };
      await axios.post(`http://localhost:1337/api/claps`, body, { headers });
      setPost((prev) => ({ ...prev, clap_count: prev.clap_count + 1 }));
    } catch (err: any) {
      console.error(err);
      setError({
        errorCode: err.response?.status,
        errorMessage: err.response?.data?.message || "Error adding clap",
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    if (newComment.trim() === "") return;
    try {
      const body = { content: newComment };
      const headers = { Authorization: `Bearer ${auth_state.auth_token}` };
      const response = await axios.post(
        `http://localhost:1337/api/posts/${post_uid}/comments`,
        body,
        { headers }
      );
      // Append the newly created comment into the comments state
      const createdComment: CommentType = response.data;
      setComments((prev) => [...prev, createdComment]);
      setNewComment("");
    } catch (err: any) {
      console.error(err);
      setError({
        errorCode: err.response?.status,
        errorMessage:
          err.response?.data?.message || "Error adding comment",
      });
    }
  };

  const handleToggleBookmark = async () => {
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${auth_state.auth_token}` };
      const body = { post_uid: post.uid };
      if (!isBookmarked) {
        await axios.post(
          `http://localhost:1337/api/bookmarks`,
          body,
          { headers }
        );
        setIsBookmarked(true);
      } else {
        await axios.delete(`http://localhost:1337/api/bookmarks`, {
          data: body,
          headers,
        });
        setIsBookmarked(false);
      }
    } catch (err: any) {
      console.error(err);
      setError({
        errorCode: err.response?.status,
        errorMessage:
          err.response?.data?.message || "Error toggling bookmark",
      });
    }
  };

  // Calculate estimated reading time (assuming 200 words per minute)
  const estimatedReadingTime =
    post.content && post.content.trim().length
      ? Math.max(1, Math.round(post.content.split(" ").length / 200))
      : 0;
  const publicationDate = post.publication_date
    ? new Date(post.publication_date).toLocaleDateString()
    : "";

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading...</p>
        </div>
      ) : error.errorMessage ? (
        <div className="text-red-600 text-center my-4">
          <p>
            Error {error.errorCode}: {error.errorMessage}
          </p>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {/* Post Header */}
          <div className="mb-6">
            {post.featured_image && (
              <img
                src={post.featured_image}
                alt="Featured"
                className="w-full h-64 object-cover rounded"
              />
            )}
            <h1 className="mt-4 text-3xl font-bold">{post.title}</h1>
            <div className="flex items-center text-gray-600 mt-2">
              <span className="mr-4">{publicationDate}</span>
              <span className="mr-4">
                {estimatedReadingTime} min read
              </span>
              <button
                onClick={handleClap}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
              >
                <span role="img" aria-label="clap" className="mr-1">
                  👏
                </span>
                <span>{post.clap_count}</span>
              </button>
              <button
                onClick={handleToggleBookmark}
                className="ml-4 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
              >
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>
              {auth_state.is_authenticated &&
                auth_state.user.uid === post.author.uid && (
                  <Link
                    to={`/editor/${post.uid}`}
                    className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                  >
                    Edit Post
                  </Link>
                )}
            </div>
            {/* Author Info */}
            <div className="flex items-center mt-4">
              {post.author.profile_image && (
                <img
                  src={post.author.profile_image}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
              )}
              <div>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-gray-600 text-sm">{post.author.bio}</p>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="prose max-w-none mb-8">
            <div
              dangerouslySetInnerHTML={{ __html: post.content }}
            ></div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                    window.location.href
                  )}&text=${encodeURIComponent(post.title)}`,
                  "_blank"
                )
              }
              className="bg-blue-400 hover:bg-blue-500 text-white px-3 py-1 rounded"
            >
              Share on Twitter
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                    window.location.href
                  )}&title=${encodeURIComponent(post.title)}`,
                  "_blank"
                )
              }
              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded"
            >
              Share on LinkedIn
            </button>
          </div>

          {/* Comments Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Comments</h2>
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.uid} className="flex items-start space-x-4">
                    {comment.user.profile_image && (
                      <img
                        src={comment.user.profile_image}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{comment.user.name}</p>
                      <p className="text-gray-600 text-sm">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No comments yet.</p>
            )}

            {/* Comment Form */}
            <div className="mt-6">
              {auth_state.is_authenticated ? (
                <form onSubmit={handleAddComment}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full border border-gray-300 rounded p-2 mb-2"
                    rows={3}
                    required
                  ></textarea>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Post Comment
                  </button>
                </form>
              ) : (
                <p>
                  Please{" "}
                  <Link to="/login" className="text-blue-500 hover:underline">
                    log in
                  </Link>{" "}
                  to post a comment.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_PostDetail;