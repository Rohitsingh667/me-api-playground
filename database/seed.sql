BEGIN TRANSACTION;
-- profile
INSERT INTO profiles (id, name, email, education, github, linkedin, portfolio)
VALUES (
  1,
  'Rohit Singh',
  'rohitraa45@gmail.com',
  'B.Tech in Computer Science & Engineering, Graphic Era Hill University (2021–2025)',
  NULL,
  NULL,
  NULL
);

-- skills
INSERT OR IGNORE INTO skills (name) VALUES
 ('Python'), ('Java'), ('C++'), ('JavaScript'), ('SQL'), ('HTML'), ('CSS'),
 ('Statistical Modeling'), ('Feature Engineering'), ('Supervised Learning'), ('Unsupervised Learning'), ('Time Series'), ('NLP'),
 ('TensorFlow'), ('scikit-learn'), ('PySpark'), ('Django'), ('React.js'), ('Node.js'), ('Express'),
 ('Tableau'), ('MySQL'), ('MongoDB'), ('AWS Redshift'), ('BigQuery'), ('AWS'), ('GCP'),
 ('REST API Development'), ('Application Integration'), ('Git'), ('Agile'), ('Scrum');

-- projects
INSERT INTO projects (title, description, links) VALUES
 ('Scrapper — Second-Hand Products Marketplace', 'Platform with visual search, logo verification, and price prediction using ML. Backend with Node.js/Express; features SVM/Random Forest and TF-IDF + Random Forest Regressor.', NULL),
 ('bookZone', 'MERN platform where users browse books and access courses after login.', 'https://dynamic-truffle-69cf89.netlify.app'),
 ('Diabetes Prediction Website', 'Web app using Django and ML to predict diabetes risk from user inputs.', 'Diabetes_Prediction (github.com)'),
 ('Movie Recommendation Website', 'Personalized movie suggestions using HTML, CSS, and Vanilla JavaScript.', 'Movie-Recommendation-Website (github.com)'),
 ('Fake News Detection', 'NLP and ML models to classify news headlines as real or fake.', 'Fake-News-Prediction (github.com)');

-- map project skills
INSERT OR IGNORE INTO project_skills (project_id, skill_id)
SELECT p.id, s.id FROM projects p JOIN skills s ON s.name IN ('React.js','Node.js','Express','TensorFlow','scikit-learn','JavaScript') WHERE p.title LIKE 'Scrapper%';
INSERT OR IGNORE INTO project_skills (project_id, skill_id)
SELECT p.id, s.id FROM projects p JOIN skills s ON s.name IN ('MongoDB','Express','React.js','Node.js','JavaScript') WHERE p.title='bookZone';
INSERT OR IGNORE INTO project_skills (project_id, skill_id)
SELECT p.id, s.id FROM projects p JOIN skills s ON s.name IN ('Django','Python','scikit-learn') WHERE p.title='Diabetes Prediction Website';
INSERT OR IGNORE INTO project_skills (project_id, skill_id)
SELECT p.id, s.id FROM projects p JOIN skills s ON s.name IN ('HTML','CSS','JavaScript') WHERE p.title='Movie Recommendation Website';
INSERT OR IGNORE INTO project_skills (project_id, skill_id)
SELECT p.id, s.id FROM projects p JOIN skills s ON s.name IN ('Python','NLP','scikit-learn') WHERE p.title='Fake News Detection';

-- work (not provided in resume summary)

-- associate profile with projects and skills
INSERT OR IGNORE INTO profile_projects (profile_id, project_id)
SELECT 1, id FROM projects;
INSERT OR IGNORE INTO profile_skills (profile_id, skill_id)
SELECT 1, id FROM skills;
COMMIT;
