USE code_arena;

-- ==========================================
-- 1. INSERT NGÔN NGỮ (Phiên bản ổn định nhất)
-- ==========================================
INSERT INTO languages (name, compiler_option, docker_image, is_active) VALUES 
('C++ 20', 'g++ -O3 -std=c++20 solution.cpp -o solution', 'gcc:13', TRUE),
('Java 21', 'javac Solution.java', 'openjdk:21-jdk-slim', TRUE),
('Python 3.12', 'python3 solution.py', 'python:3.12-slim', TRUE),
('JavaScript (Node 20)', 'node solution.js', 'node:20-slim', TRUE);

-- ==========================================
-- 2. INSERT NGƯỜI DÙNG (Admin, Moderator, Users)
-- ==========================================
-- Lưu ý: password_hash ở đây là pass123
INSERT INTO users (username, full_name, email, password_hash, role, global_rating) VALUES 
('admin_thanh', 'Admin', 'admin@codearena.com', '$2a$12$q5B6RLyavEk1uPqAkTTa1OOWIMcLExJlpF5ea7XSn7mJ8IPnLLL1a', 'admin', 1500),
('moderator_dung', 'Dũng Mod', 'dung_ra_de@codearena.com', '$2a$12$q5B6RLyavEk1uPqAkTTa1OOWIMcLExJlpF5ea7XSn7mJ8IPnLLL1a', 'moderator', 1500),
('user_nguyen', 'Nguyên', 'nguyen_pro@gmail.com', '$2a$12$q5B6RLyavEk1uPqAkTTa1OOWIMcLExJlpF5ea7XSn7mJ8IPnLLL1a', 'user', 1850),
('user_lan', 'Lan', 'lan_coder@gmail.com', '$2a$12$q5B6RLyavEk1uPqAkTTa1OOWIMcLExJlpF5ea7XSn7mJ8IPnLLL1a', 'user', 1420);

INSERT INTO profiles (user_id, bio, github_link) VALUES 
(1, 'System Administrator of Code Arena', 'https://github.com/Tri-Phung'),
(2, 'Problem Setter with 5 years exp', 'https://github.com/Tri-Phung'),
(3, 'Competitive Programmer', 'https://github.com/Tri-Phung');

-- ==========================================
-- 3. INSERT TAGS BÀI TẬP
-- ==========================================
INSERT INTO tags (name) VALUES 
('Array'), ('String'), ('Dynamic Programming'), ('Graph'), ('Math');

-- ==========================================
-- 4. INSERT BÀI TẬP (Problems)
-- ==========================================
INSERT INTO problems (title, slug, description, difficulty, time_limit, memory_limit, testcase_status, created_by) VALUES 
('Two Sum', 'two-sum', 'Cho một mảng số nguyên và một số target, tìm chỉ số của hai số có tổng bằng target.', 'easy', 1000, 256, 'ready', 2),
('Longest Palindromic Substring', 'longest-palindromic-substring', 'Tìm chuỗi đối xứng dài nhất trong một chuỗi cho trước.', 'medium', 2000, 512, 'ready', 2);

INSERT INTO problem_tags (problem_id, tag_id) VALUES 
(1, 1), (1, 5), -- Array, Math
(2, 2), (2, 3); -- String, DP

-- ==========================================
-- 5. INSERT TEST CASES (Mapping với file zip)
-- ==========================================
-- Bài 1: Two Sum
INSERT INTO test_cases (problem_id, is_sample, sample_input, sample_output, input_filename, output_filename, score_weight) VALUES 
(1, TRUE, 'nums = [2,7,11,15], target = 9', '[0,1]', '1.in', '1.out', 0), -- Sample ko tính điểm
(1, FALSE, NULL, NULL, '2.in', '2.out', 50),
(1, FALSE, NULL, NULL, '3.in', '3.out', 50);

-- Bài 2: Longest Palindromic Substring
INSERT INTO test_cases (problem_id, is_sample, sample_input, sample_output, input_filename, output_filename, score_weight) VALUES 
(2, TRUE, 's = "babad"', '"bab"', '1.in', '1.out', 0),
(2, FALSE, NULL, NULL, '2.in', '2.out', 100);

-- ==========================================
-- 6. INSERT CUỘC THI (Contests)
-- ==========================================
INSERT INTO contests (title, description, start_time, end_time, status) VALUES 
('Code Arena Opening Cup', 'Kỳ thi khai trương hệ thống, giải thưởng hấp dẫn.', NOW() - INTERVAL 1 HOUR, NOW() + INTERVAL 2 HOUR, 'active'),
('Algorithm Training #1', 'Luyện tập giải thuật cơ bản.', NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY, 'upcoming');

INSERT INTO contest_problems (contest_id, problem_id, order_index) VALUES 
(1, 1, 1), -- Bài A
(1, 2, 2); -- Bài B

INSERT INTO contest_participants (contest_id, user_id, total_score, total_penalty) VALUES 
(1, 3, 100, 45),
(1, 4, 0, 0);

-- ==========================================
-- 7. INSERT SUBMISSIONS (Giả lập quá trình thi)
-- ==========================================
-- User 3 nộp bài 1: Lần 1 sai (WA), lần 2 đúng (AC)
INSERT INTO submissions (user_id, problem_id, contest_id, language_id, source_code, status, execution_time, memory_used, score, created_at) VALUES 
(3, 1, 1, 1, '#include <iostream>...', 'WA', 150, 2048, 0, NOW() - INTERVAL 45 MINUTE),
(3, 1, 1, 1, '#include <iostream>...', 'AC', 120, 2048, 100, NOW() - INTERVAL 40 MINUTE);

-- Chi tiết test kết quả cho bài nộp AC của User 3
INSERT INTO submission_test_results (submission_id, test_case_id, status, execution_time, memory_used) VALUES 
(2, 1, 'AC', 10, 1024),
(2, 2, 'AC', 50, 2048),
(2, 3, 'AC', 60, 2048);

-- ==========================================
-- 8. DIỄN ĐÀN (Posts)
-- ==========================================
INSERT INTO posts (user_id, title, content) VALUES 
(3, 'Làm sao để tối ưu bài Two Sum?', 'Mình dùng O(n^2) nhưng bị TLE, ai giúp với?'),
(2, 'Hướng dẫn sử dụng hệ thống', 'Chào mừng các bạn đến với Code Arena, hãy đọc kỹ quy định.');
