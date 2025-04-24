import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, set_auth_state, add_app_notification } from "@/store/main";

const UV_ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { auth_state } = useAppSelector((state) => state.global);
  
  // Define the type for the editable profile
  type EditableProfileType = {
    profile_image: string;
    name: string;
    bio: string;
    social_links: Record<string, string>;
  };

  // Local state for the editable form, errors, and saving flag.
  const [editableProfile, setEditableProfile] = useState<EditableProfileType>({
    profile_image: "",
    name: "",
    bio: "",
    social_links: {},
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // On component mount, prefill the form, or navigate to login if not authenticated.
  useEffect(() => {
    if (!auth_state.is_authenticated) {
      navigate("/login");
      return;
    }
    setEditableProfile({
      profile_image: auth_state.user.profile_image || "",
      name: auth_state.user.name || "",
      bio: auth_state.user.bio || "",
      social_links: auth_state.user.social_links || {},
    });
  }, [auth_state, navigate]);

  // Handle changes for text inputs
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // For social links, we expect the input name to be in the format "social_links.twitter", etc.
    if (name.startsWith("social_links.")) {
      const key = name.split(".")[1];
      setEditableProfile((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [key]: value,
        },
      }));
    } else {
      setEditableProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate form fields; returns true if valid, false otherwise.
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!editableProfile.name || editableProfile.name.trim() === "") {
      errors.name = "Display name is required.";
    }
    // Optionally add more validations; e.g., profile_image should be a valid url
    // For social links, if present, we can check if it starts with http(s)://
    if (editableProfile.profile_image && !/^https?:\/\//.test(editableProfile.profile_image)) {
      errors.profile_image = "Profile Image URL must be valid.";
    }
    // Validate twitter link if provided
    if (editableProfile.social_links.twitter && !/^https?:\/\//.test(editableProfile.social_links.twitter)) {
      errors.twitter = "Twitter URL must be valid.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to handle saving the profile updates
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSaving(true);
    try {
      const user_uid = auth_state.user.uid;
      if (!user_uid) {
        throw new Error("User ID is missing.");
      }
      const api_base = import.meta.env.VITE_API_BASE_URL || "http://localhost:1337";
      const response = await axios.put(
        `${api_base}/api/users/${user_uid}`,
        {
          name: editableProfile.name,
          profile_image: editableProfile.profile_image,
          bio: editableProfile.bio,
          social_links: editableProfile.social_links,
        },
        {
          headers: {
            Authorization: `Bearer ${auth_state.auth_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Update global auth_state with the returned user data
      dispatch(set_auth_state({
        ...auth_state,
        user: response.data,
        is_authenticated: true,
        auth_token: auth_state.auth_token,
      }));
      // Dispatch a notification for success
      dispatch(add_app_notification({
        type: "info",
        message: "Profile updated successfully.",
        timestamp: Date.now(),
      }));
      // Navigate back to profile view
      navigate("/profile");
    } catch (error: any) {
      // If error response provides error messages, update formErrors accordingly
      if (error.response && error.response.data && typeof error.response.data === "object") {
        setFormErrors(error.response.data);
      } else {
        setFormErrors({ general: "An error occurred while updating your profile." });
      }
      setIsSaving(false);
    }
  };

  // Cancel action: simply navigate back to the profile view
  const handleCancel = () => {
    navigate("/profile");
  };

  return (
    <>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Edit Profile</h1>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Profile Image */}
          <div>
            <label htmlFor="profile_image" className="block text-sm font-medium text-gray-700">Profile Image URL</label>
            <input
              type="text"
              id="profile_image"
              name="profile_image"
              value={editableProfile.profile_image}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="https://example.com/image.jpg"
            />
            {formErrors.profile_image && (
              <p className="text-red-500 text-sm mt-1">{formErrors.profile_image}</p>
            )}
          </div>
          {/* Display Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={editableProfile.name}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Your name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>
          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={editableProfile.bio}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="Tell us something about you"
              rows={4}
            />
            {formErrors.bio && (
              <p className="text-red-500 text-sm mt-1">{formErrors.bio}</p>
            )}
          </div>
          {/* Social Media: Twitter */}
          <div>
            <label htmlFor="social_links.twitter" className="block text-sm font-medium text-gray-700">Twitter Profile URL</label>
            <input
              type="text"
              id="social_links.twitter"
              name="social_links.twitter"
              value={editableProfile.social_links.twitter || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              placeholder="https://twitter.com/yourhandle"
            />
            {formErrors.twitter && (
              <p className="text-red-500 text-sm mt-1">{formErrors.twitter}</p>
            )}
          </div>
          {/* General error message */}
          {formErrors.general && (
            <div className="text-red-500 text-sm">{formErrors.general}</div>
          )}
          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_ProfileEdit;