-- Seed evaluation criteria if table is empty
INSERT INTO evaluation_criteria (category, name, description, max_score, order_index)
SELECT 'Technical', 'Ball Control', 'Ability to receive, control, and manipulate the ball', 10, 1
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Technical', 'Passing Accuracy', 'Precision and timing in short and long passes', 10, 2
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Technical', 'First Touch', 'Quality of initial contact with the ball', 10, 3
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Technical', 'Shooting Technique', 'Form, power, and accuracy when shooting', 10, 4
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Physical', 'Speed & Acceleration', 'Quickness and ability to change pace', 10, 5
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Physical', 'Agility & Balance', 'Body control and ability to change direction', 10, 6
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Physical', 'Strength & Power', 'Physical presence and explosiveness', 10, 7
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Physical', 'Endurance & Fitness', 'Stamina and work rate throughout performance', 10, 8
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Tactical', 'Field Awareness', 'Understanding of positioning and spacing', 10, 9
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Tactical', 'Decision Making', 'Choice of action under pressure', 10, 10
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Tactical', 'Defensive Positioning', 'Ability to read the game and defend effectively', 10, 11
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Tactical', 'Attacking Movement', 'Off-ball runs and offensive positioning', 10, 12
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Mental', 'Focus & Concentration', 'Ability to maintain attention throughout play', 10, 13
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Mental', 'Composure', 'Calmness and confidence under pressure', 10, 14
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Mental', 'Work Ethic', 'Effort, hustle, and determination displayed', 10, 15
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1)
UNION ALL
SELECT 'Mental', 'Coachability', 'Responsiveness to instruction and willingness to improve', 10, 16
WHERE NOT EXISTS (SELECT 1 FROM evaluation_criteria LIMIT 1);

-- Add index for faster progress tracking queries
CREATE INDEX IF NOT EXISTS idx_evaluations_athlete_completed 
ON evaluations(athlete_id, completed_at DESC) 
WHERE status = 'completed' AND completed_at IS NOT NULL;

-- Add composite score calculation function
CREATE OR REPLACE FUNCTION get_evaluation_composite_score(eval_scores jsonb)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  total numeric := 0;
  count integer := 0;
  key text;
  value numeric;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(eval_scores)
  LOOP
    total := total + value::numeric;
    count := count + 1;
  END LOOP;
  
  IF count > 0 THEN
    RETURN total / count;
  ELSE
    RETURN 0;
  END IF;
END;
$$;