import { Router } from 'express';
import { all, get, run, begin, commit, rollback, persist } from '../services/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function fetchProfile() {
  const profile = get('SELECT * FROM profiles LIMIT 1');
  if (!profile) return null;
  const skills = all(`SELECT s.* FROM skills s
    INNER JOIN profile_skills ps ON ps.skill_id = s.id
    WHERE ps.profile_id = ? ORDER BY s.name`, [profile.id]);
  const projects = all(`SELECT p.* FROM projects p
    INNER JOIN profile_projects pp ON pp.project_id = p.id
    WHERE pp.profile_id = ? ORDER BY p.title`, [profile.id]);
  const work = all('SELECT * FROM work ORDER BY start_date DESC');
  const projectsEnriched = projects.map(p => ({
    ...p,
    skills: all(`SELECT s.* FROM skills s
      INNER JOIN project_skills ps ON ps.skill_id = s.id
      WHERE ps.project_id = ? ORDER BY s.name`, [p.id]),
    links: p.links ? p.links : null
  }));
  return { ...profile, skills, projects: projectsEnriched, work };
}

router.get('/', (req, res) => {
  const profile = fetchProfile();
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  return res.json(profile);
});

router.post('/', authMiddleware, async (req, res) => {
  const { name, email, education, links, skills = [], projects = [], work = [] } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'name and email are required' });

  try {
    begin();
    // wipe existing
    run('DELETE FROM profile_projects');
    run('DELETE FROM profile_skills');
    run('DELETE FROM profiles');
    run('DELETE FROM projects');
    run('DELETE FROM project_skills');
    run('DELETE FROM work_skills');
    run('DELETE FROM work');

    const { github = null, linkedin = null, portfolio = null } = links || {};
    const rProf = run('INSERT INTO profiles (name, email, education, github, linkedin, portfolio) VALUES (?, ?, ?, ?, ?, ?)', [name, email, education || null, github, linkedin, portfolio]);
    const profileId = rProf.lastInsertRowid;

    const ensureSkill = (s) => run('INSERT OR IGNORE INTO skills (name) VALUES (?)', [s]);
    const getSkillId = (s) => (get('SELECT id FROM skills WHERE name = ?', [s]) || {}).id;

    for (const s of skills) {
      ensureSkill(s);
      const sid = getSkillId(s);
      run('INSERT OR IGNORE INTO profile_skills (profile_id, skill_id) VALUES (?, ?)', [profileId, sid]);
    }

    for (const p of projects) {
      const r = run('INSERT INTO projects (title, description, links) VALUES (?, ?, ?)', [p.title, p.description || null, p.links || null]);
      const pid = r.lastInsertRowid;
      run('INSERT OR IGNORE INTO profile_projects (profile_id, project_id) VALUES (?, ?)', [profileId, pid]);
      const projSkills = Array.isArray(p.skills) ? p.skills : [];
      for (const s of projSkills) {
        ensureSkill(s);
        const sid = getSkillId(s);
        run('INSERT OR IGNORE INTO project_skills (project_id, skill_id) VALUES (?, ?)', [pid, sid]);
      }
    }

    for (const w of work) {
      const r = run('INSERT INTO work (company, role, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)', [w.company, w.role, w.start_date || null, w.end_date || null, w.description || null]);
      const wid = r.lastInsertRowid;
      const wskills = Array.isArray(w.skills) ? w.skills : [];
      for (const s of wskills) {
        ensureSkill(s);
        const sid = getSkillId(s);
        run('INSERT OR IGNORE INTO work_skills (work_id, skill_id) VALUES (?, ?)', [wid, sid]);
      }
    }

    commit();
    await persist();
  } catch (e) {
    try { rollback(); } catch {}
    return res.status(500).json({ error: e.message });
  }

  const profile = fetchProfile();
  return res.status(201).json(profile);
});

router.put('/', authMiddleware, async (req, res) => {
  const existing = get('SELECT id FROM profiles LIMIT 1');
  if (!existing) return res.status(404).json({ error: 'Profile not found' });
  const { name, email, education, links } = req.body;
  const { github = null, linkedin = null, portfolio = null } = links || {};
  run('UPDATE profiles SET name = COALESCE(?, name), email = COALESCE(?, email), education = COALESCE(?, education), github = COALESCE(?, github), linkedin = COALESCE(?, linkedin), portfolio = COALESCE(?, portfolio) WHERE id = ?', [name || null, email || null, education || null, github, linkedin, portfolio, existing.id]);
  await persist();
  const profile = fetchProfile();
  return res.json(profile);
});

export default router;
