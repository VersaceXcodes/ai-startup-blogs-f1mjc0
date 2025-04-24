// server.mjs
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { Pool } from "pg";

dotenv.config();

// Initialize PostgreSQL pool with the provided configuration snippet
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, JWT_SECRET, PORT } = process.env;
const pool = new Pool({
  host: PGHOST || "ep-ancient-dream-abbsot9k-pooler.eu-west-2.aws.neon.tech",
  database: PGDATABASE || "neondb",
  username: PGUSER || "neondb_owner",
  password: PGPASSWORD || "npg_jAS3aITLC5DX",
  port: 5432,
  ssl: {
    require: true,
  },
});

// Initialize Express app and middleware setup
const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Helper: Get current Unix timestamp (in seconds)
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

// Middleware: Authenticate JWT token for secured endpoints
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET || "secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Token invalid" });
    req.user = user; // user object: { uid, email, is_admin }
    next();
  });
}

/*
  Route: POST /api/users/register
  Description:
    Registers a new user by hashing the password and inserting into the users table.
    Returns a JWT token along with user info upon successful registration.
*/
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    // Hash password using bcrypt
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const uid = uuidv4();
    const timestamp = getCurrentTimestamp();

    // Insert new user record (profile_image, bio, social_links can be null)
    const insertQuery = `
      INSERT INTO users (uid, name, email, password_hash, profile_image, bio, social_links, is_admin, created_at, updated_at)
      VALUES ($1, $2, $3, $4, null, null, null, false, $5, $5)
      RETURNING uid, name, email, is_admin, created_at, updated_at
    `;
    const { rows } = await pool.query(insertQuery, [uid, name, email, password_hash, timestamp]);
    const newUser = rows[0];

    // Generate JWT token
    const token = jwt.sign({ uid: newUser.uid, email: newUser.email, is_admin: newUser.is_admin }, JWT_SECRET || "secret", { expiresIn: "1d" });
    res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/users/login
  Description:
    Authenticates user credentials by comparing password hash and returns JWT token with user details.
*/
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    // Query user record by email
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });
    const user = rows[0];

    // Compare provided password with stored hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ uid: user.uid, email: user.email, is_admin: user.is_admin }, JWT_SECRET || "secret", { expiresIn: "1d" });
    // Exclude password_hash from response
    const { password_hash, ...userData } = user;
    res.status(200).json({ token, user: userData });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: GET /api/users/:uid
  Description:
    Retrieves the profile information of a user. Secured endpoint using JWT.
*/
app.get("/api/users/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { rows } = await pool.query("SELECT uid, name, email, profile_image, bio, social_links, is_admin, created_at, updated_at FROM users WHERE uid = $1", [uid]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error retrieving user profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: PUT /api/users/:uid
  Description:
    Updates the profile of a user. Only the owner or an admin can update.
*/
app.put("/api/users/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    // Only allow user to update own profile unless admin
    if (req.user.uid !== uid && !req.user.is_admin)
      return res.status(403).json({ message: "Unauthorized" });

    const { name, profile_image, bio, social_links } = req.body;
    const timestamp = getCurrentTimestamp();
    const updateQuery = `
      UPDATE users
      SET name = COALESCE($1, name),
          profile_image = COALESCE($2, profile_image),
          bio = COALESCE($3, bio),
          social_links = COALESCE($4, social_links),
          updated_at = $5
      WHERE uid = $6
      RETURNING uid, name, email, profile_image, bio, social_links, is_admin, created_at, updated_at
    `;
    const { rows } = await pool.query(updateQuery, [name, profile_image, bio, social_links, timestamp, uid]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/posts
  Description:
    Creates a new blog post. Authenticated authors can create posts as draft or published.
    If tags are provided, they are inserted into the posts_tags join table.
*/
app.post("/api/posts", authenticateToken, async (req, res) => {
  try {
    const { title, content, featured_image, status, tags } = req.body;
    if (!title || !content)
      return res.status(400).json({ message: "Missing required fields" });

    const uid = uuidv4();
    const timestamp = getCurrentTimestamp();
    const postStatus = status ? status : "draft";
    const insertPostQuery = `
      INSERT INTO posts (uid, title, content, author_uid, status, featured_image, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
      RETURNING *
    `;
    const { rows } = await pool.query(insertPostQuery, [uid, title, content, req.user.uid, postStatus, featured_image || null, timestamp]);
    const newPost = rows[0];

    // If tags are provided, link them in posts_tags
    if (tags && Array.isArray(tags)) {
      for (const tagUid of tags) {
        await pool.query("INSERT INTO posts_tags(post_uid, tag_uid) VALUES ($1, $2)", [uid, tagUid]);
      }
      newPost.tags = tags;
    } else {
      newPost.tags = [];
    }
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: GET /api/posts
  Description:
    Retrieves a list of published blog posts with support for pagination, tag filtering, and search.
    After retrieving posts, associated tags are fetched and merged into each post.
*/
app.get("/api/posts", async (req, res) => {
  try {
    // Default values for pagination
    let { page, limit, tag, search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const offset = (page - 1) * limit;

    // Build dynamic query
    let baseQuery = `
      SELECT p.*, u.name as author_name, u.profile_image as author_image
      FROM posts p
      JOIN users u ON p.author_uid = u.uid
      WHERE p.status = 'published'
    `;
    const values = [];
    if (search) {
      values.push(`%${search}%`);
      baseQuery += ` AND (p.title ILIKE $${values.length} OR p.content ILIKE $${values.length})`;
    }
    if (tag) {
      values.push(tag);
      baseQuery += ` AND p.uid IN (SELECT post_uid FROM posts_tags WHERE tag_uid = $${values.length})`;
    }
    // Add pagination
    values.push(limit, offset);
    baseQuery += ` ORDER BY p.created_at DESC LIMIT $${values.length-1} OFFSET $${values.length}`;

    const { rows: posts } = await pool.query(baseQuery, values);

    // Retrieve tags for the retrieved posts
    if (posts.length > 0) {
      const postIds = posts.map(post => post.uid);
      const tagsQuery = `
        SELECT post_uid, array_agg(tag_uid) as tags
        FROM posts_tags
        WHERE post_uid = ANY($1)
        GROUP BY post_uid
      `;
      const { rows: tagRows } = await pool.query(tagsQuery, [postIds]);
      // Map tags to posts
      const tagsMap = {};
      tagRows.forEach(tr => {
        tagsMap[tr.post_uid] = tr.tags;
      });
      posts.forEach(post => {
        post.tags = tagsMap[post.uid] || [];
      });
    }
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error retrieving posts:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: GET /api/posts/:uid
  Description:
    Retrieves detailed information for a specific post including author info and tags.
*/
app.get("/api/posts/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    // Get post details along with author info
    const postQuery = `
      SELECT p.*, u.name as author_name, u.email as author_email, u.profile_image as author_profile_image, u.bio as author_bio
      FROM posts p
      JOIN users u ON p.author_uid = u.uid
      WHERE p.uid = $1
    `;
    const { rows } = await pool.query(postQuery, [uid]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    const post = rows[0];

    // Retrieve tags for the post
    const tagsQuery = "SELECT array_agg(tag_uid) as tags FROM posts_tags WHERE post_uid = $1 GROUP BY post_uid";
    const { rows: tagRows } = await pool.query(tagsQuery, [uid]);
    post.tags = tagRows.length > 0 ? tagRows[0].tags : [];
    
    // Build author object
    post.author = {
      uid: post.author_uid,
      name: post.author_name,
      email: post.author_email,
      profile_image: post.author_profile_image,
      bio: post.author_bio
    };
    // Remove duplicated author fields in main post object
    delete post.author_name;
    delete post.author_email;
    delete post.author_profile_image;
    delete post.author_bio;
    
    res.status(200).json(post);
  } catch (error) {
    console.error("Error retrieving post details:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: PUT /api/posts/:uid
  Description:
    Updates an existing post. Only the author or an admin may update.
    If tags are provided, old tags are removed and replaced with new ones.
*/
app.put("/api/posts/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    // Retrieve the post to verify ownership
    const { rows: postRows } = await pool.query("SELECT * FROM posts WHERE uid = $1", [uid]);
    if (postRows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    const post = postRows[0];
    if (req.user.uid !== post.author_uid && !req.user.is_admin)
      return res.status(403).json({ message: "Unauthorized" });

    const { title, content, featured_image, status, tags } = req.body;
    const timestamp = getCurrentTimestamp();
    const updateQuery = `
      UPDATE posts
      SET title = COALESCE($1, title),
          content = COALESCE($2, content),
          featured_image = COALESCE($3, featured_image),
          status = COALESCE($4, status),
          updated_at = $5
      WHERE uid = $6
      RETURNING *
    `;
    const { rows: updatedRows } = await pool.query(updateQuery, [title, content, featured_image, status, timestamp, uid]);
    let updatedPost = updatedRows[0];

    // Manage tags: delete existing and add new tags if provided
    if (tags && Array.isArray(tags)) {
      await pool.query("DELETE FROM posts_tags WHERE post_uid = $1", [uid]);
      for (const tagUid of tags) {
        await pool.query("INSERT INTO posts_tags(post_uid, tag_uid) VALUES ($1, $2)", [uid, tagUid]);
      }
      updatedPost.tags = tags;
    } else {
      // Otherwise retrieve existing tags
      const tagData = await pool.query("SELECT array_agg(tag_uid) as tags FROM posts_tags WHERE post_uid = $1 GROUP BY post_uid", [uid]);
      updatedPost.tags = tagData.rows.length > 0 ? tagData.rows[0].tags : [];
    }
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: DELETE /api/posts/:uid
  Description:
    Deletes a post. Only the author or an admin may perform deletion.
    Associated records in posts_tags, claps, bookmarks, and comments are also removed.
*/
app.delete("/api/posts/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    // Verify post ownership
    const { rows: postRows } = await pool.query("SELECT * FROM posts WHERE uid = $1", [uid]);
    if (postRows.length === 0)
      return res.status(404).json({ message: "Post not found" });
    const post = postRows[0];
    if (req.user.uid !== post.author_uid && !req.user.is_admin)
      return res.status(403).json({ message: "Unauthorized" });

    // Delete associated records first
    await pool.query("DELETE FROM posts_tags WHERE post_uid = $1", [uid]);
    await pool.query("DELETE FROM claps WHERE post_uid = $1", [uid]);
    await pool.query("DELETE FROM bookmarks WHERE post_uid = $1", [uid]);
    await pool.query("DELETE FROM comments WHERE post_uid = $1", [uid]);
    // Delete the post
    await pool.query("DELETE FROM posts WHERE uid = $1", [uid]);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/posts/:post_uid/comments
  Description:
    Creates a new comment on a specified post. Supports an optional parent_comment_uid for threaded replies.
*/
app.post("/api/posts/:post_uid/comments", authenticateToken, async (req, res) => {
  try {
    const { post_uid } = req.params;
    const { content, parent_comment_uid } = req.body;
    if (!content)
      return res.status(400).json({ message: "Content is required" });

    const uid = uuidv4();
    const timestamp = getCurrentTimestamp();
    const insertCommentQuery = `
      INSERT INTO comments (uid, post_uid, user_uid, content, parent_comment_uid, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $6)
      RETURNING *
    `;
    const { rows } = await pool.query(insertCommentQuery, [uid, post_uid, req.user.uid, content, parent_comment_uid || null, timestamp]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: PUT /api/comments/:uid
  Description:
    Updates the content of an existing comment. Only the comment owner or an admin can update.
*/
app.put("/api/comments/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { content } = req.body;
    if (!content)
      return res.status(400).json({ message: "Content is required" });

    // Retrieve the comment to verify ownership
    const { rows: commentRows } = await pool.query("SELECT * FROM comments WHERE uid = $1", [uid]);
    if (commentRows.length === 0)
      return res.status(404).json({ message: "Comment not found" });
    const comment = commentRows[0];
    if (req.user.uid !== comment.user_uid && !req.user.is_admin)
      return res.status(403).json({ message: "Unauthorized" });

    const timestamp = getCurrentTimestamp();
    const updateQuery = `
      UPDATE comments
      SET content = $1,
          updated_at = $2
      WHERE uid = $3
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [content, timestamp, uid]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: DELETE /api/comments/:uid
  Description:
    Deletes a comment. Only the comment owner or an admin can perform deletion.
*/
app.delete("/api/comments/:uid", authenticateToken, async (req, res) => {
  try {
    const { uid } = req.params;
    const { rows: commentRows } = await pool.query("SELECT * FROM comments WHERE uid = $1", [uid]);
    if (commentRows.length === 0)
      return res.status(404).json({ message: "Comment not found" });
    const comment = commentRows[0];
    if (req.user.uid !== comment.user_uid && !req.user.is_admin)
      return res.status(403).json({ message: "Unauthorized" });

    await pool.query("DELETE FROM comments WHERE uid = $1", [uid]);
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/claps
  Description:
    Adds a clap to a post by either creating a new record or updating an existing one.
    Implements one-clap-per-user-per-post with a possibility to increment multiple times.
*/
app.post("/api/claps", authenticateToken, async (req, res) => {
  try {
    const { post_uid, increment } = req.body;
    if (!post_uid)
      return res.status(400).json({ message: "post_uid is required" });
    const inc = increment || 1;
    const timestamp = getCurrentTimestamp();

    // Check if a clap record already exists for this user and post
    const { rows } = await pool.query("SELECT * FROM claps WHERE user_uid = $1 AND post_uid = $2", [req.user.uid, post_uid]);
    let clap;
    if (rows.length > 0) {
      // Update existing clap record
      const newCount = rows[0].clap_count + inc;
      const updateQuery = `
        UPDATE claps
        SET clap_count = $1, created_at = $2
        WHERE user_uid = $3 AND post_uid = $4
        RETURNING *
      `;
      const { rows: updatedRows } = await pool.query(updateQuery, [newCount, timestamp, req.user.uid, post_uid]);
      clap = updatedRows[0];
    } else {
      // Insert new clap record
      const insertQuery = `
        INSERT INTO claps (user_uid, post_uid, clap_count, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const { rows: insertedRows } = await pool.query(insertQuery, [req.user.uid, post_uid, inc, timestamp]);
      clap = insertedRows[0];
    }
    res.status(200).json(clap);
  } catch (error) {
    console.error("Error adding clap:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/bookmarks
  Description:
    Adds a bookmark for a post by the authenticated user.
*/
app.post("/api/bookmarks", authenticateToken, async (req, res) => {
  try {
    const { post_uid } = req.body;
    if (!post_uid)
      return res.status(400).json({ message: "post_uid is required" });
    const timestamp = getCurrentTimestamp();
    // Insert bookmark (if duplicate, error can be handled by DB primary key constraint)
    const insertQuery = `
      INSERT INTO bookmarks (user_uid, post_uid, created_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [req.user.uid, post_uid, timestamp]);
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: DELETE /api/bookmarks
  Description:
    Removes an existing bookmark for a post by the authenticated user.
*/
app.delete("/api/bookmarks", authenticateToken, async (req, res) => {
  try {
    const { post_uid } = req.body;
    if (!post_uid)
      return res.status(400).json({ message: "post_uid is required" });
    await pool.query("DELETE FROM bookmarks WHERE user_uid = $1 AND post_uid = $2", [req.user.uid, post_uid]);
    res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: GET /api/tags
  Description:
    Retrieves all available tags from the tags table.
*/
app.get("/api/tags", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM tags ORDER BY name ASC");
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error retrieving tags:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/reports
  Description:
    Allows an authenticated user to report a post or comment for moderation.
*/
app.post("/api/reports", authenticateToken, async (req, res) => {
  try {
    const { report_type, object_uid, reason } = req.body;
    if (!report_type || !object_uid)
      return res.status(400).json({ message: "Missing required fields" });
    const uid = uuidv4();
    const timestamp = getCurrentTimestamp();
    const insertQuery = `
      INSERT INTO reports (uid, report_type, object_uid, reported_by_uid, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await pool.query(insertQuery, [uid, report_type, object_uid, req.user.uid, reason || null, timestamp]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

/*
  Route: POST /api/password_resets
  Description:
    Initiates a password reset process by generating a reset token and recording it in the password_resets table.
    NOTE: In production, the token would be emailed to the user.
*/
app.post("/api/password_resets", async (req, res) => {
  try {
    const { user_email } = req.body;
    if (!user_email)
      return res.status(400).json({ message: "user_email is required" });
    
    // Check if the user exists
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [user_email]);
    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });
    
    const token = uuidv4();
    const timestamp = getCurrentTimestamp();
    const expire_at = timestamp + 3600; // Token expires in 1 hour

    const insertQuery = `
      INSERT INTO password_resets (user_email, token, created_at, expire_at)
      VALUES ($1, $2, $3, $4)
      RETURNING token, expire_at
    `;
    const result = await pool.query(insertQuery, [user_email, token, timestamp, expire_at]);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error initiating password reset:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server on the designated port from environment (default 1337)
const port = PORT || 1337;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});