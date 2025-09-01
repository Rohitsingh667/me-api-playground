PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  education TEXT,
  github TEXT,
  linkedin TEXT,
  portfolio TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  links TEXT
);

CREATE TABLE IF NOT EXISTS project_skills (
  project_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (project_id, skill_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS work (
  id INTEGER PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  description TEXT
);

-- Junction table to associate work and skills
CREATE TABLE IF NOT EXISTS work_skills (
  work_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (work_id, skill_id),
  FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- Associate profile with work/projects/skills (single candidate)
CREATE TABLE IF NOT EXISTS profile_projects (
  profile_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  PRIMARY KEY (profile_id, project_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  PRIMARY KEY (profile_id, skill_id),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);
