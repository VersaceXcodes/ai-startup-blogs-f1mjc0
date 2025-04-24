import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAppSelector, useAppDispatch, add_app_notification } from "@/store/main";

const UV_PostEditor: React.FC = () => {
  const { post_uid } = useParams<{ post_uid?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth_state = useAppSelector((state) => state.global.auth_state);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!auth_state.is_authenticated) {
      navigate("/login");
    }
  }, [auth_state.is_authenticated, navigate]);

  // Local state variables as per the datamap
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [featuredImage, setFeaturedImage] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("draft");
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [error, setError] = useState<{ errorCode?: number; errorMessage?: string }>({});
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [autoSaveTimerId, setAutoSaveTimerId] = useState<NodeJS.Timeout | null>(null);

  // Use environment variable or default value for API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";

  // Fetch the existing post, if editing
  useEffect(() => {
    if (post_uid) {
      const fetchPostForEditing = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/posts/${post_uid}`);
          const postData = response.data;
          setTitle(postData.title || "");
          setContent(postData.content || "");
          setFeaturedImage(postData.featured_image || "");
          setTags(postData.tags || []);
          setStatus(postData.status || "draft");
          setUnsavedChanges(false);
        } catch (err: any) {
          setError({
            errorCode: err.response?.status,
            errorMessage: err.response?.data?.message || err.message,
          });
        }
      };
      fetchPostForEditing();
    }
  }, [post_uid, API_BASE_URL]);

  // Auto-save mechanism (every 10 seconds if unsaved changes exist)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (unsavedChanges) {
        // Auto-save silently; pass flag isAutoSave = true
        handleSaveDraft(true);
      }
    }, 10000);
    setAutoSaveTimerId(intervalId);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [unsavedChanges, title, content, featuredImage, tags, status]);

  // Warn user if navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChanges]);

  // Handlers for input changes mark unsavedChanges true
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setUnsavedChanges(true);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setUnsavedChanges(true);
  };

  const handleFeaturedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFeaturedImage(e.target.value);
    setUnsavedChanges(true);
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Split tags by comma and trim spaces
    setTags(value.split(",").map((tag) => tag.trim()).filter((tag) => tag));
    setUnsavedChanges(true);
  };

  // Helper function for simple text insertion formatting in content
  const insertAtCursor = (insertionText: string) => {
    setContent(content + insertionText);
    setUnsavedChanges(true);
  };

  const handleInsertBold = () => {
    insertAtCursor(" **bold text** ");
  };
  const handleInsertItalic = () => {
    insertAtCursor(" *italic text* ");
  };
  const handleInsertHeader = () => {
    insertAtCursor("\n# Header\n");
  };
  const handleInsertList = () => {
    insertAtCursor("\n- List item\n");
  };
  const handleInsertBlockquote = () => {
    insertAtCursor("\n> Blockquote\n");
  };
  const handleInsertCode = () => {