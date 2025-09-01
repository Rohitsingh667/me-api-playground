import { Router } from 'express';
import { all, get } from '../services/db.js';

const router = Router();

function paginateParams(req) {
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  return { limit, offset };
}

router.get('/projects', (req, res) => {
  const { limit, offset } = paginateParams(req);
  const skill = req.query.skill || null;
  let rows;
  if (skill) {
    rows = all(`SELECT p.* FROM projects p
      JOIN project_skills ps ON ps.project_id = p.id
      JOIN skills s ON s.id = ps.skill_id
      WHERE LOWER(s.name) = LOWER(?)
      ORDER BY p.title
      LIMIT ? OFFSET ?`, [skill, limit, offset]);
  } else {
    rows = all('SELECT * FROM projects ORDER BY title LIMIT ? OFFSET ?', [limit, offset]);
  }
  const total = skill
    ? get(`SELECT COUNT(*) as c FROM projects p
      JOIN project_skills ps ON ps.project_id = p.id
      JOIN skills s ON s.id = ps.skill_id
      WHERE LOWER(s.name) = LOWER(?)`, [skill]).c
    : get('SELECT COUNT(*) as c FROM projects').c;
  return res.json({ total, items: rows });
});

router.get('/skills/top', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '10', 10), 100);
  const rows = all(`SELECT s.name,
    (SELECT COUNT(*) FROM project_skills ps WHERE ps.skill_id = s.id) +
    (SELECT COUNT(*) FROM work_skills ws WHERE ws.skill_id = s.id) as usage_count
    FROM skills s
    ORDER BY usage_count DESC, s.name ASC
    LIMIT ?`, [limit]);
  return res.json(rows);
});

router.get('/skills', (req, res) => {
  const rows = all('SELECT name FROM skills ORDER BY name');
  return res.json(rows.map(r => r.name));
});

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ projects: [], skills: [], work: [] });
  const like = `%${q.toLowerCase()}%`;
  const projects = all('SELECT * FROM projects WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? ORDER BY title', [like, like]);
  const skills = all('SELECT * FROM skills WHERE LOWER(name) LIKE ? ORDER BY name', [like]);
  const work = all('SELECT * FROM work WHERE LOWER(company) LIKE ? OR LOWER(role) LIKE ? OR LOWER(description) LIKE ? ORDER BY start_date DESC', [like, like, like]);
  return res.json({ projects, skills, work });
});

export default router;
