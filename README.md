# SecureMeal

SecureMeal is a full-stack hostel mess management system built for DBMS-style academic demonstration and local deployment. It includes student and admin workflows, MySQL-backed APIs, demo fallback mode, and a Database Lab screen for live SQL showcase.

## Features

- Student registration with generated student ID
- Student login and admin login
- Mess menu management
- Attendance marking and attendance summary
- Feedback submission and review
- Demo-ready fallback mode when MySQL is unavailable
- Database Lab Mode for safe SQL demo queries
- Enterprise SQL blueprint with advanced tables, triggers, views, and procedures

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- HTTP Client: Axios
- Styling: Plain CSS

## Project Structure

```text
SecureMeal/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── scripts/
│   ├── sql/
│   ├── db.js
│   ├── demoStore.js
│   ├── schema.sql
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles.css
│   └── vite.config.js
└── README.md
```

## Local Setup

### 1. Start the backend

```bash
cd /Users/priyanshupanda/Documents/Motivss/SecureMeal/backend
npm install
node server.js
```

Backend runs at:

```text
http://localhost:5000
```

### 2. Start the frontend

```bash
cd /Users/priyanshupanda/Documents/Motivss/SecureMeal/frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file inside `backend/` using:

```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=securemeal
```

## Demo Login

Use these demo accounts from the login screen:

- Student: `Aarav Sharma` with ID `101`
- Student: `Diya Patel` with ID `102`
- Student: `Rohan Verma` with ID `103`
- Admin: `Mess Admin`

## Database Lab Mode

After logging in as admin, open:

```text
http://localhost:5173/lab
```

This screen supports:

- Safe SQL playground
- Prebuilt demo queries
- Procedure demo buttons
- Query result tables
- Basic result visualization
- Query logs and trigger activity panel

Allowed query types:

- `SELECT`
- `SHOW`
- `DESC`
- `EXPLAIN`
- approved `CALL`

## Enterprise SQL Blueprint

The advanced database showcase file is located at:

[`backend/sql/enterprise_blueprint.sql`](/Users/priyanshupanda/Documents/Motivss/SecureMeal/backend/sql/enterprise_blueprint.sql)

Load it into MySQL with:

```bash
mysql -u root -p
```

Then inside MySQL:

```sql
SOURCE /Users/priyanshupanda/Documents/Motivss/SecureMeal/backend/sql/enterprise_blueprint.sql;
```

This creates a separate database:

```text
securemeal_enterprise
```

## Useful Commands

Show backend health:

```bash
curl http://localhost:5000/api/health
```

Show menu API:

```bash
curl http://localhost:5000/api/menu
```

Run migrations:

```bash
cd /Users/priyanshupanda/Documents/Motivss/SecureMeal/backend
npm run migrate
```

## GitHub Update Flow

Whenever you make changes:

```bash
cd /Users/priyanshupanda/Documents/Motivss/SecureMeal
git status
git add .
git commit -m "Describe your changes"
git push
```

## Notes

- The main working app uses the `securemeal` database.
- The advanced DBMS showcase uses `securemeal_enterprise`.
- Demo fallback mode helps the project stay presentable even if MySQL is temporarily unavailable.
