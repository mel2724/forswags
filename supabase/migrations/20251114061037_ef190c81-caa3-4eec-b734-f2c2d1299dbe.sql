-- Drop old foreign key pointing to quizzes table
ALTER TABLE questions
DROP CONSTRAINT questions_quiz_id_fkey;

-- Add new foreign key pointing to lesson_quizzes table
ALTER TABLE questions
ADD CONSTRAINT questions_quiz_id_fkey
FOREIGN KEY (quiz_id)
REFERENCES lesson_quizzes(id)
ON DELETE CASCADE;