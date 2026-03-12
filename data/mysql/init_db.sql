-- Xóa DB cũ nếu tồn tại
DROP DATABASE IF EXISTS code_arena;
CREATE DATABASE code_arena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE code_arena;

-- ==========================================
-- 1. QUẢN LÝ NGƯỜI DÙNG
-- ==========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    global_rating INT DEFAULT 0,
    previous_global_rating INT DEFAULT 0,
    is_contest_chat_locked BOOLEAN DEFAULT FALSE,
    is_discussion_locked BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

CREATE TABLE profiles (
    user_id INT PRIMARY KEY,
    avatar_url VARCHAR(255),
    bio TEXT,
    github_link VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. CẤU HÌNH MÁY CHẤM
-- ==========================================
CREATE TABLE languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    compiler_option VARCHAR(255),
    docker_image VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. QUẢN LÝ BÀI TẬP
-- ==========================================
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description LONGTEXT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    time_limit INT DEFAULT 1000,
    memory_limit INT DEFAULT 256,
    testcase_status ENUM('not_uploaded', 'ready', 'error') DEFAULT 'not_uploaded',
    created_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty)
);

CREATE TABLE test_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    sample_input TEXT,
    sample_output TEXT,
    input_filename VARCHAR(100),
    output_filename VARCHAR(100),
    score_weight INT DEFAULT 1,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE problem_tags (
    problem_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (problem_id, tag_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. QUẢN LÝ CUỘC THI
-- ==========================================
CREATE TABLE contests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('upcoming', 'active', 'finished', 'cancelled') DEFAULT 'upcoming',
    is_frozen BOOLEAN DEFAULT FALSE,
    frozen_reason VARCHAR(500),
    created_by INT,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE contest_problems (
    contest_id INT NOT NULL,
    problem_id INT NOT NULL,
    order_index INT DEFAULT 0,       -- Thứ tự bài A, B, C...
    PRIMARY KEY (contest_id, problem_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE contest_participants (
    contest_id INT NOT NULL,
    user_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_score INT DEFAULT 0,
    total_penalty INT DEFAULT 0,
    status ENUM('JOINED', 'DISQUALIFIED') DEFAULT 'JOINED',
    violation_count INT DEFAULT 0,
    has_score_penalty BOOLEAN DEFAULT FALSE,
    has_joined_active BOOLEAN DEFAULT FALSE,
    is_camera_violating BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (contest_id, user_id),
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. KẾT QUẢ BÀI NỘP
-- ==========================================
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    contest_id INT NULL,
    language_id INT NOT NULL,
    source_code LONGTEXT NOT NULL,
    status ENUM('pending', 'judging', 'AC', 'WA', 'TLE', 'MLE', 'RE', 'CE') DEFAULT 'pending',
    execution_time INT DEFAULT 1000,
    memory_used INT DEFAULT 256,
    score INT DEFAULT 0,
    is_test_run BOOLEAN DEFAULT FALSE,
    error_message LONGTEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL,
    FOREIGN KEY (language_id) REFERENCES languages(id),
    
    INDEX idx_penalty_calc (contest_id, user_id, problem_id, created_at)
);

CREATE TABLE submission_test_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    test_case_id INT NOT NULL,
    status ENUM('AC', 'WA', 'TLE', 'MLE', 'RE') NOT NULL,
    execution_time INT DEFAULT 0, 
    memory_used INT DEFAULT 0,
    user_output TEXT,                -- Chỉ lưu output của user nếu là Sample test
    
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. DIỄN ĐÀN THẢO LUẬN
-- ==========================================
CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE contests MODIFY COLUMN status ENUM('upcoming', 'active', 'finished', 'cancelled') DEFAULT 'upcoming';
ALTER TABLE contests MODIFY COLUMN description LONGTEXT;
ALTER TABLE users MODIFY COLUMN global_rating INT DEFAULT 0;