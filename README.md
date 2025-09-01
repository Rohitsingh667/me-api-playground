- Backend: Node.js + Express
- Database: SQLite (file: database/app.db) using better-sqlite3, with SQL schema and seed
- Frontend: Static HTML/CSS/JS served by Express under `/`
- Middleware: helmet, morgan (logging), basic rate-limit
- Auth: HTTP Basic auth for write operations (POST/PUT /profile)
- Tests: Jest + Supertest

## Endpoints

- GET /health → 200 { status: "ok" }
- GET /profile → returns profile with skills, projects (with skills), work, links
- POST /profile (Basic auth) → create/replace profile (body: { name, email, education, skills[], projects[], work[], links{ github, linkedin, portfolio } })
- PUT /profile (Basic auth) → update basic fields (name, email, education, links)
- GET /projects?skill=React&limit=10&offset=0 → list projects, optionally filtered by skill (pagination)
- GET /skills/top?limit=10 → top skills by usage across projects and work
- GET /skills → all skills
- GET /search?q=... → search across projects, skills, and work

## Database Schema

See database/schema.sql for table definitions and database/seed.sql for seed data.

## Local Setup

1. Install dependencies
   - npm install
2. Run dev server
   - npm run start (or npm run dev for nodemon)
3. Open http://localhost:3000 to view the ui

Environment variables (optional):

- BASIC_USER=admin
- BASIC_PASS=admin
- PORT=3000

Set them in the environment; avoid committing secrets. In Builder, use the DevServer settings to set env vars.

## Write Operations (Basic Auth)

Use HTTP Basic auth. Example header value for admin:admin is `Authorization: Basic YWRtaW46YWRtaW4=`

## Sample cURL

```bash
# Health
curl -s http://localhost:3000/health

# Read profile
curl -s http://localhost:3000/profile | jq

# Projects by skill
curl -s "http://localhost:3000/projects?skill=React&limit=5" | jq

# Search
curl -s "http://localhost:3000/search?q=react" | jq

# Create/replace profile (example)
curl -s -X POST http://localhost:3000/profile \
  -H 'Authorization: Basic YWRtaW46YWRtaW4=' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "education": "B.S. Computer Science",
    "links": {"github": "https://github.com/janedoe"},
    "skills": ["JavaScript", "React"],
    "projects": [
      {"title": "Portfolio Site", "description": "Static site", "skills": ["React", "CSS"]}
    ],
    "work": [
      {"company": "Acme", "role": "Engineer", "start_date": "2022-01-01", "description": "Built stuff", "skills": ["React"]}
    ]
  }'
```

## Limitations

- Single-profile design; intended as a personal playground
- Basic search (LIKE) and simple ranking
- No authentication for reads; Basic auth only for writes
