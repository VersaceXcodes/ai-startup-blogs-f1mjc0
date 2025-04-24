import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "@/store/main";

const UV_UserProfile: React.FC = () => {
  const { user_uid } = useParams<{ user_uid?: string }>();
  const dispatch = useAppDispatch();
  const auth_state = useAppSelector((state) => state.global.auth_state);

  const [userProfile, setUserProfile] = useState<{
    profile_image: string;
    name: string;
    bio: string;
    social_links: Record<string, string>;
  }>({
    profile_image: "",
    name: "",
    bio: "",
    social_links: {},
  });
  const [segmentedTab, setSegmentedTab] = useState<string>("My Posts");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Define API base URL using VITE_API_BASE_URL env variable
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Determine which profile to display: the route param or the current logged in user.
  const profileUid = user_uid ? user_uid : auth_state.user.uid;

  // Function to fetch user's profile and associated lists
  const fetchUserProfile = async () => {
    if (!profileUid) return;
    setIsLoading(true);
    try {
      // Fetch user profile data
      const profileResponse = await axios.get(`${apiBase}/api/users/${profileUid}`, {
        headers: {
          Authorization: auth_state.auth_token ? `Bearer ${auth_state.auth_token}` : "",
        },
      });
      setUserProfile({
        profile_image: profileResponse.data.profile_image || "",
        name: profileResponse.data.name || "",
        bio: profileResponse.data.bio || "",
        social_links: profileResponse.data.social_links || {},
      });
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }

    // Fetch associated lists based on the active segmentedTab
    if (segmentedTab === "My Posts") {
      try {
        const postsResponse = await axios.get(`${apiBase}/api/posts`, {
          params: {
            author_uid: profileUid,
            limit: 50,
          },
          headers: {
            Authorization: auth_state.auth_token ? `Bearer ${auth_state.auth_token}` : "",
          },
        });
        setMyPosts(postsResponse.data);
      } catch (error) {
        console.error("Failed to fetch user posts", error);
        setMyPosts([]);
      }
    } else if (segmentedTab === "Bookmarks") {
      // Bookmarks endpoint is not defined, so this is currently simulated as an empty list.
      setBookmarks([]);
    } else if (segmentedTab === "Activity") {
      // Activity feed is currently simulated as an empty list.
      setActivityFeed([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segmentedTab, profileUid]);

  // Determine if the current logged in user is the profile owner
  const is_profile_owner = auth_state.user.uid === profileUid;

  return (
    <>
      <div className="max-w-4xl mx-auto p-4">
        {isLoading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <img
                src={userProfile.profile_image || "https://picsum.photos/seed/default/100/100"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold">{userProfile.name || "User Name"}</h1>
                <p className="text-gray-600">{userProfile.bio || "No bio available."}</p>
                <div className="flex space-x-2 mt-2">
                  {userProfile.social_links &&
                    Object.keys(userProfile.social_links).map((key) => (
                      <a
                        key={key}
                        href={userProfile.social_links[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {key}
                      </a>
                    ))}
                </div>
              </div>
              {is_profile_owner && (
                <div className="ml-auto">
                  <Link to="/profile/edit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 border-b border-gray-300">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSegmentedTab("My Posts")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    segmentedTab === "My Posts"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  My Posts
                </button>
                <button
                  onClick={() => setSegmentedTab("Bookmarks")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    segmentedTab === "Bookmarks"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Bookmarks
                </button>
                <button
                  onClick={() => setSegmentedTab("Activity")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    segmentedTab === "Activity"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Activity
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {segmentedTab === "My Posts" && (
                <div>
                  {myPosts.length > 0 ? (
                    <ul className="space-y-4">
                      {myPosts.map((post) => (
                        <li key={post.uid} className="p-4 border rounded hover:shadow">
                          <h2 className="text-xl font-semibold">
                            <Link to={`/post/${post.uid}`} className="text-blue-500 hover:underline">
                              {post.title}
                            </Link>
                          </h2>
                          <p className="text-gray-600 mt-1">
                            {post.excerpt || (post.content ? post.content.slice(0, 100) + "..." : "")}
                          </p>
                          <p className="text-gray-400 text-sm mt-2">
                            Published: {post.created_at ? new Date(post.created_at).toLocaleDateString() : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No posts found.</p>
                  )}
                </div>
              )}
              {segmentedTab === "Bookmarks" && (
                <div>
                  {bookmarks.length > 0 ? (
                    <ul className="space-y-4">
                      {bookmarks.map((bookmark) => (
                        <li key={bookmark.uid} className="p-4 border rounded hover:shadow">
                          <h2 className="text-xl font-semibold">
                            <Link to={`/post/${bookmark.post_uid}`} className="text-blue-500 hover:underline">
                              {bookmark.title || "Bookmarked Post"}
                            </Link>
                          </h2>
                          <p className="text-gray-600 mt-1">{bookmark.excerpt || ""}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No bookmarks found.</p>
                  )}
                </div>
              )}
              {segmentedTab === "Activity" && (
                <div>
                  {activityFeed.length > 0 ? (
                    <ul className="space-y-4">
                      {activityFeed.map((activity, index) => (
                        <li key={index} className="p-4 border rounded hover:shadow">
                          <p className="text-gray-600">{activity.message || "Activity details"}</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {activity.created_at ? new Date(activity.created_at).toLocaleDateString() : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No recent activity found.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UV_UserProfile;