import React from "react";
import { Routes, Route } from "react-router-dom";

/* Import shared global views */
import GV_TopNav from '@/components/views/GV_TopNav.tsx';
import GV_Footer from '@/components/views/GV_Footer.tsx';

/* Import unique views */
import UV_Homepage from '@/components/views/UV_Homepage.tsx';
import UV_PostDetail from '@/components/views/UV_PostDetail.tsx';
import UV_PostEditor from '@/components/views/UV_PostEditor.tsx';
import UV_Registration from '@/components/views/UV_Registration.tsx';
import UV_Login from '@/components/views/UV_Login.tsx';
import UV_ForgotPassword from '@/components/views/UV_ForgotPassword.tsx';
import UV_UserProfile from '@/components/views/UV_UserProfile.tsx';
import UV_ProfileEdit from '@/components/views/UV_ProfileEdit.tsx';
import UV_SearchResults from '@/components/views/UV_SearchResults.tsx';
import UV_TagFilteredPosts from '@/components/views/UV_TagFilteredPosts.tsx';
import UV_AdminDashboard from '@/components/views/UV_AdminDashboard.tsx';

const App: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <GV_TopNav />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<UV_Homepage />} />
          <Route path="/post/:post_uid" element={<UV_PostDetail />} />
          <Route path="/editor" element={<UV_PostEditor />} />
          <Route path="/editor/:post_uid" element={<UV_PostEditor />} />
          <Route path="/register" element={<UV_Registration />} />
          <Route path="/login" element={<UV_Login />} />
          <Route path="/forgot-password" element={<UV_ForgotPassword />} />
          <Route path="/profile" element={<UV_UserProfile />} />
          <Route path="/profile/:user_uid" element={<UV_UserProfile />} />
          <Route path="/profile/edit" element={<UV_ProfileEdit />} />
          <Route path="/search" element={<UV_SearchResults />} />
          <Route path="/tag/:tag_uid" element={<UV_TagFilteredPosts />} />
          <Route path="/admin" element={<UV_AdminDashboard />} />
        </Routes>
      </main>

      <GV_Footer />
    </div>
  );
};

export default App;