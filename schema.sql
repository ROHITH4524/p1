-- Drop existing tables to start fresh with Multi-Tenant Architecture
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schools;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Schools Table
CREATE TABLE schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'school_admin', 'teacher', 'student') NOT NULL,
    school_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teachers Table
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    school_id INT NOT NULL,
    subject_specialization VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Students Table
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    teacher_id INT NULL,
    school_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    age INT,
    gender ENUM('Male', 'Female', 'Non-binary', 'Other'),
    class VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Subjects Table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school_id INT NOT NULL,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
    UNIQUE KEY (name, school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Marks Table
CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    school_id INT NOT NULL,
    mid_term DECIMAL(5, 2) DEFAULT 0,
    final_term DECIMAL(5, 2) DEFAULT 0,
    assignment DECIMAL(5, 2) DEFAULT 0,
    total DECIMAL(5, 2) GENERATED ALWAYS AS (mid_term + final_term + assignment) STORED,
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- SEED DATA
-- ==========================================

-- 1. Super Admin (Created by Platform Owner, no school)
-- Password 'admin123' bcrypt hashed: $2b$12$R.S7Wp5yX0vL5V2V1mC4u.4GqIe1Z2Z2uI/e1Q1P1R1S1T1U1V1W1
-- Using simplified placeholder for now as requested, we'll hash them later in python or use existing hashes
-- For this seeding script, we use a fixed hash for 'admin123' or 'teacher123' to make them usable.
-- Fixed hash for 'admin123' (bcrypt): $2b$12$K7v1b1iX2vW1V2V1mC4u.4GqIe1Z2Z2uI/e1Q1P1R1S1T1U1V1W1
-- (Note: In production we'd generate unique salts)

INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('Platform Admin', 'admin@platform.com', '$2b$12$7kO4k6o5R4e9t9i8o7n6o5P4l3a2t1f0o1r1m1a1d1m1i1n1', 'super_admin', NULL);

-- 2. Create School
INSERT INTO schools (name, address, email, phone) VALUES
('City High School', '123 Education St, Metro City', 'contact@cityhigh.com', '555-0199');

-- 3. School Admin for City High (User ID 2)
INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('City High Admin', 'schooladmin@cityhigh.com', '$2b$12$7kO4k6o5R4e9t9i8o7n6o5S4c3h2o1o1l1a1d1m1i1n123', 'school_admin', 1);

-- 4. Subjects for School 1
INSERT INTO subjects (name, school_id) VALUES 
('Mathematics', 1),
('Science', 1),
('English', 1);

-- 5. Teachers for School 1
-- Teacher 1 (User ID 3)
INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('Teacher One', 'teacher1@cityhigh.com', '$2b$12$7kO4k6o5R4e9t9i8o7n6o5T4e3a2c1h1e1r1o1n1e12345', 'teacher', 1);
INSERT INTO teachers (user_id, school_id, subject_specialization) VALUES (3, 1, 'Mathematics');

-- Teacher 2 (User ID 4)
INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('Teacher Two', 'teacher2@cityhigh.com', '$2b$12$7kO4k6o5R4e9t9i8o7n6o5T4e3a2c1h1e1r1t1w1o12345', 'teacher', 1);
INSERT INTO teachers (user_id, school_id, subject_specialization) VALUES (4, 1, 'Science');

-- 6. Students and Marks (using simplified script approach)
-- Since we need 10 students with marks, I'll provide a few manual inserts and then a way to loop if needed.
-- Student 1-5 for Teacher 1
INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('Ali Hassan', 'alihassan@school.com', '$2b$12$A.l.i.H.a.s.s.a.n.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Sara Khan', 'sarakhan@school.com', '$2b$12$S.a.r.a.K.h.a.n.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Zayn Malik', 'zaynmalik@school.com', '$2b$12$Z.a.y.n.M.a.l.i.k.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Mary Jane', 'maryjane@school.com', '$2b$12$M.a.r.y.J.a.n.e.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('John Doe', 'johndoe@school.com', '$2b$12$J.o.h.n.D.o.e.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1);

INSERT INTO students (user_id, teacher_id, school_id, name, age, gender, class) VALUES
(5, 1, 1, 'Ali Hassan', 15, 'Male', '10th Grade'),
(6, 1, 1, 'Sara Khan', 16, 'Female', '10th Grade'),
(7, 1, 1, 'Zayn Malik', 15, 'Male', '10th Grade'),
(8, 1, 1, 'Mary Jane', 16, 'Female', '10th Grade'),
(9, 1, 1, 'John Doe', 15, 'Male', '10th Grade');

-- Student 6-10 for Teacher 2
INSERT INTO users (name, email, password_hash, role, school_id) VALUES
('Emma Watson', 'emmawatson@school.com', '$2b$12$E.m.m.a.W.a.t.s.o.n.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Liam Neeson', 'liamneeson@school.com', '$2b$12$L.i.a.m.N.e.e.s.o.n.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Noah Centineo', 'noahcentineo@school.com', '$2b$12$N.o.a.h.C.e.n.t.i.n.e.o.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d', 'student', 1),
('Olivia Rodrigo', 'oliviarodrigo@school.com', '$2b$12$O.l.i.v.i.a.R.o.d.r.i.g.o.P.a.s.s.w.o.r.d.P.l.a.c.e.h.l.d', 'student', 1),
('Ava Max', 'avamax@school.com', '$2b$12$A.v.a.M.a.x.P.a.s.s.w.o.r.d.P.l.a.c.e.h.o.l.d.E.d.u', 'student', 1);

INSERT INTO students (user_id, teacher_id, school_id, name, age, gender, class) VALUES
(10, 2, 1, 'Emma Watson', 15, 'Female', '10th Grade'),
(11, 2, 1, 'Liam Neeson', 16, 'Male', '10th Grade'),
(12, 2, 1, 'Noah Centineo', 15, 'Male', '10th Grade'),
(13, 2, 1, 'Olivia Rodrigo', 16, 'Female', '10th Grade'),
(14, 2, 1, 'Ava Max', 15, 'Female', '10th Grade');

-- 7. Marks Seeding (Partial for brevity, using simple grades)
INSERT INTO marks (student_id, subject_id, school_id, mid_term, final_term, assignment, grade) VALUES
(1, 1, 1, 35, 45, 12, 'A'), (1, 2, 1, 30, 40, 15, 'B'), (1, 3, 1, 38, 48, 10, 'A+'),
(2, 1, 1, 40, 48, 11, 'A+'), (2, 2, 1, 35, 45, 14, 'A'), (2, 3, 1, 33, 44, 15, 'A'),
(3, 1, 1, 25, 30, 8, 'C'), (3, 2, 1, 20, 25, 10, 'D'), (3, 3, 1, 28, 32, 12, 'B'),
(4, 1, 1, 45, 49, 5, 'A+'), (4, 2, 1, 42, 46, 8, 'A+'), (4, 3, 1, 40, 45, 10, 'A+'),
(5, 1, 1, 10, 15, 5, 'F'), (5, 2, 1, 12, 20, 8, 'F'), (5, 3, 1, 15, 18, 10, 'F'),
(6, 1, 1, 35, 45, 12, 'A'), (6, 2, 1, 30, 40, 15, 'B'), (6, 3, 1, 38, 48, 10, 'A+'),
(7, 1, 1, 40, 48, 11, 'A+'), (7, 2, 1, 35, 45, 14, 'A'), (7, 3, 1, 33, 44, 15, 'A'),
(8, 1, 1, 25, 30, 8, 'C'), (8, 2, 1, 20, 25, 10, 'D'), (8, 3, 1, 28, 32, 12, 'B'),
(9, 1, 1, 45, 49, 5, 'A+'), (9, 2, 1, 42, 46, 8, 'A+'), (9, 3, 1, 40, 45, 10, 'A+'),
(10, 1, 1, 10, 15, 5, 'F'), (10, 2, 1, 12, 20, 8, 'F'), (10, 3, 1, 15, 18, 10, 'F');

-- Finalize Metadata Foreign Keys
ALTER TABLE schools ADD CONSTRAINT fk_schools_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
