-- Create tables with utf8mb4 charset for Student Performance Analytics Platform

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender VARCHAR(50),
    class VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Marks Table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    mid_term DECIMAL(5, 2) DEFAULT 0,
    final_term DECIMAL(5, 2) DEFAULT 0,
    assignment DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(5, 2) GENERATED ALWAYS AS (mid_term + final_term + assignment) STORED,
    grade VARCHAR(10),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Seed Data
-- ==========================================

-- Insert 1 admin, 1 teacher, and 5 students
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User', 'admin@example.com', 'hashed_password_placeholder', 'admin'),
('Teacher One', 'teacher@example.com', 'hashed_password_placeholder', 'teacher'),
('Student One', 'student1@example.com', 'hashed_password_placeholder', 'student'),
('Student Two', 'student2@example.com', 'hashed_password_placeholder', 'student'),
('Student Three', 'student3@example.com', 'hashed_password_placeholder', 'student'),
('Student Four', 'student4@example.com', 'hashed_password_placeholder', 'student'),
('Student Five', 'student5@example.com', 'hashed_password_placeholder', 'student');

-- Insert 5 students linked to user_ids 3 to 7
INSERT INTO students (user_id, name, age, gender, class) VALUES
(3, 'Student One', 15, 'Male', '10th Grade'),
(4, 'Student Two', 16, 'Female', '10th Grade'),
(5, 'Student Three', 15, 'Non-binary', '10th Grade'),
(6, 'Student Four', 16, 'Male', '10th Grade'),
(7, 'Student Five', 15, 'Female', '10th Grade');

-- Insert 3 subjects
INSERT INTO subjects (name) VALUES
('Mathematics'),
('Science'),
('English');

-- Insert marks for all 5 students in all 3 subjects
INSERT INTO marks (student_id, subject_id, mid_term, final_term, assignment, grade) VALUES
-- Student 1
(1, 1, 30.5, 45.0, 15.0, 'A'),
(1, 2, 28.0, 40.0, 18.0, 'B+'),
(1, 3, 35.0, 48.0, 12.0, 'A+'),

-- Student 2
(2, 1, 25.0, 35.0, 10.0, 'B'),
(2, 2, 30.0, 42.0, 15.0, 'A'),
(2, 3, 20.0, 30.0, 10.0, 'C'),

-- Student 3
(3, 1, 40.0, 50.0, 20.0, 'A+'),
(3, 2, 38.0, 48.0, 19.0, 'A+'),
(3, 3, 36.0, 46.0, 18.0, 'A'),

-- Student 4
(4, 1, 15.0, 25.0, 8.0, 'C-'),
(4, 2, 20.0, 30.0, 12.0, 'C'),
(4, 3, 18.0, 28.0, 14.0, 'C'),

-- Student 5
(5, 1, 32.0, 46.0, 16.0, 'A'),
(5, 2, 29.0, 41.0, 15.0, 'B+'),
(5, 3, 31.0, 44.0, 17.0, 'A');
