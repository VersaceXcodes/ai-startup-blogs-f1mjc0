import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch, set_global_loading } from "@/store/main";

interface OverviewMetrics {
  total_posts: number;
  total_comments: number;
  flagged_posts: number;
  flagged_comments: number;
  user_reports: number;
}

interface ContentItem {
  uid: string;
  type: string; // "post" or "comment"
  title?: string;
  content_excerpt?: string;
  author: {
    uid: string;
    name: string;
  };
  status: string;
  created_at: number;
}

interface DateRange {
  from: number;
  to: number;
}

interface FilterCriteria {
  status: string;
  date_range: DateRange;
  author: string;
  search: string;
}

interface SelectedItem {
  uid: string;
  type: string;
  details: any;
  title?: string;
  content_excerpt?: string;
  author?: {
    uid: string;
    name: string;
  };
  status?: string;
  created_at?: number;
}

interface ModerationActionState {
  action: string;
  inProgress: boolean;
  error: string;
}

const UV_AdminDashboard: React.FC = () => {
  const auth_state = useAppSelector((state) => state.global.auth_state);
  const dispatch = useAppDispatch();

  const [overviewMetrics, setOverviewMetrics] = useState<OverviewMetrics>({
    total_posts: 0,
    total_comments: 0,
    flagged_posts: 0,
    flagged_comments: 0,
    user_reports: 0
  });
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    status: "all",
    date_range: { from: 0, to: 0 },
    author: "",
    search: ""
  });
  const [selectedItem, setSelectedItem] = useState<SelectedItem>({
    uid: "",
    type: "",
    details: {}
  });
  const [moderationActionState, setModerationActionState] = useState<ModerationActionState>({
    action: "",
    inProgress: false,
    error: ""
  });

  const fetchOverviewMetrics = async () => {
    try {
      dispatch(set_global_loading(true));
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/metrics`,
        { headers: { Authorization: `Bearer ${auth_state.auth_token}` } }
      );
      setOverviewMetrics(response.data);
      dispatch(set_global_loading(false));
    } catch (error) {
      console.error("Error fetching overview metrics:", error);
      dispatch(set_global_loading(false));
    }
  };

  const fetchContentList = async () => {
    try {
      dispatch(set_global_loading(true));
      const params = {
        status: filterCriteria.status,
        author: filterCriteria.author,
        search: filterCriteria.search,
        from: filterCriteria.date_range.from,
        to: filterCriteria.date_range.to
      };
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/content`,
        { headers: { Authorization: `Bearer ${auth_state.auth_token}` }, params }
      );
      setContentList(response.data);
      dispatch(set_global_loading(false));
    } catch (error) {
      console.error("Error fetching content list:", error);
      dispatch(set_global_loading(false));
    }
  };

  const refreshDashboard = async () => {
    await fetchOverviewMetrics();
    await fetchContentList();
  };

  const deleteContentItem = async (item: ContentItem) => {
    try {
      setModerationActionState({ action: "delete", inProgress: true, error: "" });
      let url = "";
      if (item.type === "post") {
        url = `${import.meta.env.VITE_API_BASE_URL}/api/posts/${item.uid}`;
      } else if (item.type === "comment") {
        url = `${import.meta.env.VITE_API_BASE_URL}/api/comments/${item.uid}`;
      }
      if (url) {
        await axios.delete(url, { headers: { Authorization: `Bearer ${auth_state.auth_token}` } });
        await fetchContentList();
        setModerationActionState({ action: "delete", inProgress: false, error: "" });
      }
    } catch (error) {
      console.error("Error deleting content item:", error);
      setModerationActionState({ action: "delete", inProgress: false, error: "Failed to delete content" });
    }
  };

  const flagContentItem = async (item: ContentItem) => {
    try {
      setModerationActionState({ action: "flag", inProgress: true, error: "" });
      // Assuming the flag endpoint is: PUT /api/admin/flag with body containing uid and type.
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/flag`,
        { uid: item.uid, type: item.type },
        { headers: { Authorization: `Bearer ${auth_state.auth_token}` } }
      );
      await fetchContentList();
      setModerationActionState({ action: "flag", inProgress: false, error: "" });
    } catch (error) {
      console.error("Error flagging content item:", error);
      setModerationActionState({ action: "flag", inProgress: false, error: "Failed to flag content" });
    }
  };

  const viewContentDetails = (item: ContentItem) => {
    setSelectedItem(item);
  };

  const closeModal = () => {
    setSelectedItem({ uid: "", type: "", details: {} });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterCriteria({ ...filterCriteria, status: e.target.value });
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterCriteria({ ...filterCriteria, author: e.target.value });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterCriteria({ ...filterCriteria, search: e.target.value });
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = e.target.value ? new Date(e.target.value).getTime() : 0;
    setFilterCriteria({
      ...filterCriteria,
      date_range: { ...filterCriteria.date_range, from: timestamp }
    });
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = e.target.value ? new Date(e.target.value).getTime() : 0;
    setFilterCriteria({
      ...filterCriteria,
      date_range: { ...filterCriteria.date_range, to: timestamp }
    });
  };

  useEffect(() => {
    if (auth_state.is_authenticated && auth_state.user.is_admin) {
      fetchOverviewMetrics();
      fetchContentList();
    }
  }, [filterCriteria]);

  useEffect(() => {
    if (auth_state.is_authenticated && auth_state.user.is_admin) {
      fetchOverviewMetrics();
      fetchContentList();
    }
  }, []);

  if (!auth_state.is_authenticated || !auth_state.user.is_admin) {
    return (
      <>
        <div className="p-4 text-center text-red-500">
          Access Denied. You do not have admin privileges.
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <button
          onClick={refreshDashboard}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Refresh Dashboard
        </button>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-semibold">Total Posts</h2>
            <p>{overviewMetrics.total_posts}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-semibold">Total Comments</h2>
            <p>{overviewMetrics.total_comments}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-semibold">Flagged Posts</h2>
            <p>{overviewMetrics.flagged_posts}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-semibold">Flagged Comments</h2>
            <p>{overviewMetrics.flagged_comments}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-semibold">User Reports</h2>
            <p>{overviewMetrics.user_reports}</p>
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Filters</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block mb-1">Status</label>
              <select
                value={filterCriteria.status}
                onChange={handleStatusChange}
                className="border p-1 rounded"
              >
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="flagged">Flagged</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Author</label>
              <input
                type="text"
                value={filterCriteria.author}
                onChange={handleAuthorChange}
                placeholder="Author uid or name"
                className="border p-1 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Search</label>
              <input
                type="text"
                value={filterCriteria.search}
                onChange={handleSearchChange}
                placeholder="Search keyword"
                className="border p-1 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">From Date</label>
              <input
                type="date"
                onChange={handleFromDateChange}
                className="border p-1 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">To Date</label>
              <input
                type="date"
                onChange={handleToDateChange}
                className="border p-1 rounded"
              />
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Content List</h2>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Title/Excerpt</th>
                <th className="border px-4 py-2">Author</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contentList.length > 0 ? (
                contentList.map((item) => (
                  <tr key={item.uid} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{item.type}</td>
                    <td className="border px-4 py-2">
                      {item.title || item.content_excerpt}
                    </td>
                    <td className="border px-4 py-2">{item.author.name}</td>
                    <td className="border px-4 py-2">{item.status}</td>
                    <td className="border px-4 py-2">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => viewContentDetails(item)}
                        className="bg-green-500 text-white px-2 py-1 rounded"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteContentItem(item)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => flagContentItem(item)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded"
                      >
                        Flag
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No content available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {moderationActionState.inProgress && (
          <div className="mt-4 text-blue-500">
            Processing {moderationActionState.action}...
          </div>
        )}
        {moderationActionState.error && (
          <div className="mt-4 text-red-500">
            {moderationActionState.error}
          </div>
        )}
      </div>
      {selectedItem.uid !== "" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-11/12 md:w-1/2">
            <h2 className="text-2xl font-bold mb-4">Content Details</h2>
            <p>
              <strong>Type:</strong> {selectedItem.type}
            </p>
            <p>
              <strong>Title/Excerpt:</strong> {selectedItem.title || selectedItem.content_excerpt}
            </p>
            <p>
              <strong>Author:</strong>{" "}
              {selectedItem.author ? selectedItem.author.name : "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {selectedItem.status}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {selectedItem.created_at
                ? new Date(selectedItem.created_at).toLocaleString()
                : "N/A"}
            </p>
            <div className="mt-4">
              <button
                onClick={closeModal}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_AdminDashboard;