-- Create the "users" table
CREATE TABLE IF NOT EXISTS users (
  uid             VARCHAR(255) PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  profile_image   VARCHAR(255),
  bio             TEXT,
  social_links    JSON,
  is_admin        BOOLEAN NOT NULL DEFAULT false,
  created_at      BIGINT NOT NULL,
  updated_at      BIGINT NOT NULL
);

-- Create the "posts" table
CREATE TABLE IF NOT EXISTS posts (
  uid             VARCHAR(255) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT NOT NULL,
  author_uid      VARCHAR(255) NOT NULL,
  status          VARCHAR(50) NOT NULL DEFAULT 'draft',
  featured_image  VARCHAR(255),
  created_at      BIGINT NOT NULL,
  updated_at      BIGINT NOT NULL,
  CONSTRAINT fk_posts_author
      FOREIGN KEY (author_uid) REFERENCES users(uid)
);

-- Create the "tags" table
CREATE TABLE IF NOT EXISTS tags (
  uid         VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  created_at  BIGINT NOT NULL,
  updated_at  BIGINT NOT NULL
);

-- Create the "posts_tags" join table (Many-to-Many between posts and tags)
CREATE TABLE IF NOT EXISTS posts_tags (
  post_uid    VARCHAR(255) NOT NULL,
  tag_uid     VARCHAR(255) NOT NULL,
  PRIMARY KEY (post_uid, tag_uid),
  CONSTRAINT fk_posts_tags_post
      FOREIGN KEY (post_uid) REFERENCES posts(uid),
  CONSTRAINT fk_posts_tags_tag
      FOREIGN KEY (tag_uid) REFERENCES tags(uid)
);

-- Create the "claps" table for tracking post claps (likes)
CREATE TABLE IF NOT EXISTS claps (
  user_uid    VARCHAR(255) NOT NULL,
  post_uid    VARCHAR(255) NOT NULL,
  clap_count  INTEGER NOT NULL DEFAULT 1,
  created_at  BIGINT NOT NULL,
  PRIMARY KEY (user_uid, post_uid),
  CONSTRAINT fk_claps_user
      FOREIGN KEY (user_uid) REFERENCES users(uid),
  CONSTRAINT fk_claps_post
      FOREIGN KEY (post_uid) REFERENCES posts(uid)
);

-- Create the "comments" table
CREATE TABLE IF NOT EXISTS comments (
  uid                   VARCHAR(255) PRIMARY KEY,
  post_uid              VARCHAR(255) NOT NULL,
  user_uid              VARCHAR(255) NOT NULL,
  content               TEXT NOT NULL,
  parent_comment_uid    VARCHAR(255),
  created_at            BIGINT NOT NULL,
  updated_at            BIGINT NOT NULL,
  CONSTRAINT fk_comments_post
      FOREIGN KEY (post_uid) REFERENCES posts(uid),
  CONSTRAINT fk_comments_user
      FOREIGN KEY (user_uid) REFERENCES users(uid),
  CONSTRAINT fk_comments_parent
      FOREIGN KEY (parent_comment_uid) REFERENCES comments(uid)
);

-- Create the "bookmarks" table
CREATE TABLE IF NOT EXISTS bookmarks (
  user_uid   VARCHAR(255) NOT NULL,
  post_uid   VARCHAR(255) NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_uid, post_uid),
  CONSTRAINT fk_bookmarks_user
      FOREIGN KEY (user_uid) REFERENCES users(uid),
  CONSTRAINT fk_bookmarks_post
      FOREIGN KEY (post_uid) REFERENCES posts(uid)
);

-- Create the "reports" table for content moderation
CREATE TABLE IF NOT EXISTS reports (
  uid              VARCHAR(255) PRIMARY KEY,
  report_type      VARCHAR(50) NOT NULL,  -- E.g., 'post' or 'comment'
  object_uid       VARCHAR(255) NOT NULL,
  reported_by_uid  VARCHAR(255) NOT NULL,
  reason           TEXT,
  created_at       BIGINT NOT NULL,
  CONSTRAINT fk_reports_user
      FOREIGN KEY (reported_by_uid) REFERENCES users(uid)
);

-- Create the "password_resets" table
CREATE TABLE IF NOT EXISTS password_resets (
  user_email  VARCHAR(255) NOT NULL,
  token       VARCHAR(255) PRIMARY KEY,
  created_at  BIGINT NOT NULL,
  expire_at   BIGINT NOT NULL,
  CONSTRAINT fk_password_reset_user
      FOREIGN KEY (user_email) REFERENCES users(email)
);

---------------------------------------------------------------------
-- SEED DATA
---------------------------------------------------------------------

-- Seed the "users" table with sample users
INSERT INTO users (uid, name, email, password_hash, profile_image, bio, social_links, is_admin, created_at, updated_at) VALUES
('user1', 'Alice Smith', 'alice@example.com', 'hash_alice', 'https://picsum.photos/seed/alice/200/300', 'AI enthusiast and content creator.', '{"twitter": "https://twitter.com/alice"}', true, 1690000000, 1690000000),
('user2', 'Bob Johnson', 'bob@example.com', 'hash_bob', 'https://picsum.photos/seed/bob/200/300', 'Tech and startup lover.', '{"linkedin": "https://linkedin.com/in/bob"}', false, 1690000100, 1690000100),
('user3', 'Carol Danvers', 'carol@example.com', 'hash_carol', 'https://picsum.photos/seed/carol/200/300', 'Content creator and blogger in AI.', '{"twitter": "https://twitter.com/carol"}', false, 1690000200, 1690000200),
('user4', 'David Lee', 'david@example.com', 'hash_david', 'https://picsum.photos/seed/david/200/300', 'Moderator and tech enthusiast.', '{"facebook": "https://facebook.com/david"}', true, 1690000300, 1690000300),
('user5', 'Eve Torres', 'eve@example.com', 'hash_eve', 'https://picsum.photos/seed/eve/200/300', 'Passionate reader and blogger.', '{"instagram": "https://instagram.com/eve"}', false, 1690000400, 1690000400);

-- Seed the "posts" table with sample blog posts
INSERT INTO posts (uid, title, content, author_uid, status, featured_image, created_at, updated_at) VALUES
('post1', 'Introduction to AI', 'Content about the basics of AI.', 'user1', 'published', 'https://picsum.photos/seed/ai/600/400', 1690001000, 1690001000),
('post2', 'Advanced Startup Strategies', 'In-depth look at startup strategies.', 'user3', 'draft', NULL, 1690002000, 1690002000),
('post3', 'Machine Learning Trends', 'Machine learning is evolving rapidly.', 'user1', 'published', 'https://picsum.photos/seed/ml/600/400', 1690003000, 1690003000),
('post4', 'How to Pitch Investors', 'Effective techniques to pitch investors.', 'user3', 'published', 'https://picsum.photos/seed/pitch/600/400', 1690004000, 1690004000),
('post5', 'The Future of Tech', 'A glimpse into the future of technology.', 'user2', 'draft', 'https://picsum.photos/seed/tech/600/400', 1690005000, 1690005000);

-- Seed the "tags" table with sample tags
INSERT INTO tags (uid, name, created_at, updated_at) VALUES
('tag1', 'AI', 1690006000, 1690006000),
('tag2', 'Startup', 1690006100, 1690006100),
('tag3', 'Machine Learning', 1690006200, 1690006200),
('tag4', 'Tech', 1690006300, 1690006300);

-- Seed the "posts_tags" table to link posts and tags
INSERT INTO posts_tags (post_uid, tag_uid) VALUES
('post1', 'tag1'),
('post1', 'tag3'),
('post2', 'tag2'),
('post3', 'tag1'),
('post3', 'tag3'),
('post3', 'tag4'),
('post4', 'tag2'),
('post4', 'tag4'),
('post5', 'tag1'),
('post5', 'tag4');

-- Seed the "claps" table with sample clapping data
INSERT INTO claps (user_uid, post_uid, clap_count, created_at) VALUES
('user2', 'post1', 1, 1690001100),
('user3', 'post1', 2, 1690001150),
('user2', 'post3', 1, 1690003100),
('user1', 'post4', 1, 1690004050),
('user5', 'post4', 3, 1690004070);

-- Seed the "comments" table with sample comments and replies
INSERT INTO comments (uid, post_uid, user_uid, content, parent_comment_uid, created_at, updated_at) VALUES
('comm1', 'post1', 'user2', 'Great introduction to AI!', NULL, 1690001200, 1690001200),
('comm2', 'post1', 'user1', 'Thank you for your comment!', 'comm1', 1690001250, 1690001250),
('comm3', 'post3', 'user5', 'Very informative post on machine learning trends.', NULL, 1690003200, 1690003200),
('comm4', 'post4', 'user3', 'Thanks for the pitching tips!', NULL, 1690004100, 1690004100);

-- Seed the "bookmarks" table with sample bookmark entries
INSERT INTO bookmarks (user_uid, post_uid, created_at) VALUES
('user2', 'post3', 1690003150),
('user3', 'post1', 1690001210),
('user5', 'post4', 1690004150),
('user1', 'post5', 1690005050);

-- Seed the "reports" table with sample moderation reports
INSERT INTO reports (uid, report_type, object_uid, reported_by_uid, reason, created_at) VALUES
('rep1', 'post', 'post5', 'user4', 'Inappropriate content', 1690005100),
('rep2', 'comment', 'comm3', 'user2', 'Spam comment', 1690003250);

-- Seed the "password_resets" table with sample reset tokens
INSERT INTO password_resets (user_email, token, created_at, expire_at) VALUES
('alice@example.com', 'reset_token_1', 1690006000, 1690009600),
('bob@example.com', 'reset_token_2', 1690006100, 1690009700);