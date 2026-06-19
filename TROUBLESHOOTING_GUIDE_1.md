# Computech JobFlow: Troubleshooting & Error Reference

**A quick reference guide for errors you've encountered and how to fix them.**

---

## Table of Contents

1. [Database & Schema Errors](#database--schema-errors)
2. [Authentication & Session Errors](#authentication--session-errors)
3. [API & Routing Errors](#api--routing-errors)
4. [Testing & Curl Errors](#testing--curl-errors)
5. [Node.js & Express Setup Errors](#nodejs--express-setup-errors)

---

## Database & Schema Errors

### Error 1: Foreign Key Constraint Violation

**Error Message:**

```text
Error: insert or update on table "applications" violates foreign key constraint
Key (user_id)=(1) is not present in table "users".
```

**What Happened:**
You tried to create an application for a user that doesn't exist in the
`users` table. The database is protecting referential integrity.

**Root Cause:**

- You didn't create a test user in the database yet
- Or you're using a user_id that has no matching user

**How to Fix:**

```sql
-- Check: Does the user exist?
SELECT * FROM users WHERE id = 1;

-- If not, create a test user:
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('test@example.com', 'hash_here', 'Test', 'User');

-- Then try creating the application again
```

**Prevention:**

- Always create test users before testing application creation
- When writing code, validate that user_id exists before inserting

---

### Error 2: Table Doesn't Exist

**Error Message:**

```text
Error: relation "applications" does not exist
```

**What Happened:**
You tried to query a table that hasn't been created yet.

**Root Cause:**

- You forgot to run the `schema.sql` file
- Or you ran it in the wrong database

**How to Fix:**

```bash
# In computech-jobflow/ (root)
# Verify you're using the correct database:
psql -U postgres -d computech_jobflow

# Inside PostgreSQL:
\dt  # List tables

# If empty, run your schema file:
# Exit first: \q
# Then run:
psql -U postgres -d computech_jobflow -f backend/schema.sql
```

**Prevention:**

- Always verify tables exist before running the backend: `\dt`
- Keep your `schema.sql` file in version control

---

### Error 3: Column Doesn't Exist

**Error Message:**

```text
Error: column "user_id" of relation "applications" does not exist
```

**What Happened:**
Your code is trying to use a column that doesn't exist in the table.

**Root Cause:**

- Column name mismatch (e.g., you named it `userId` in code but `user_id` in schema)
- Or the column truly wasn't created

**How to Fix:**

```sql
-- In PostgreSQL, check the table structure:
\d applications

-- Verify the column name matches exactly what you're using in code
```

**Prevention:**

- Use `snake_case` for database columns (user_id, not userId)
- Always verify column names before writing queries

---

## Authentication & Session Errors

### Error 4: "You Must Be Logged In"

**Error Message:**

```json
{"error":"You must be logged in"}
```

**What Happened:**
You tried to access a protected route, but the session wasn't found.

**Root Cause (Multiple Possibilities):**

- You made separate curl requests without saving cookies
- Session expired
- Middleware check ran before session was created
- Browser didn't send the session cookie

**How to Fix:**

**For curl testing:**

```bash
# Save cookies from login:
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Send cookies with next request:
curl -b cookies.txt http://localhost:5000/api/applications
```

**For browser testing:**

- Session cookie should be automatic (no action needed)
- Check browser DevTools → Application → Cookies
- Make sure the session cookie is there

**Prevention:**

- Always use `-c` and `-b` flags with curl for multi-step testing
- Test authentication in a browser for real-world behavior

---

### Error 5: "Invalid Email or Password"

**Error Message:**

```json
{"error":"Invalid email or password"}
```

**What Happened:**
Login failed because email doesn't exist or password is wrong.

**Root Cause:**

- User doesn't exist
- Password is incorrect
- Password wasn't hashed when user was created

**How to Fix:**

```sql
-- Check if user exists:
SELECT * FROM users WHERE email = 'test@example.com';

-- If user exists, verify password hash is set:
SELECT id, email, password_hash FROM users;

-- If password_hash is empty or fake, update it:
UPDATE users SET password_hash = '$2b$10$...' WHERE id = 1;
```

**Prevention:**

- Always create users with the registration endpoint (it hashes passwords)
- For test users, use a known bcrypt hash
- When debugging, log the password comparison result

---

### Error 6: "Email Already Registered"

**Error Message:**

```json
{"error":"Email already registered"}
```

**What Happened:**
Someone tried to register with an email that already exists.

**Root Cause:**

- The email is already in the database
- This is actually working correctly (a feature, not a bug)

**How to Fix:**

```bash
# Either use a different email:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new_email@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Or delete the old user if testing:
# In PostgreSQL:
DELETE FROM users WHERE email = 'old@example.com';
```

**Prevention:**

- Use different emails for different test users
- Keep track of test emails you've used

---

## API & Routing Errors

### Error 7: "Cannot POST /api/applications"

**Error Message:**

```text
Cannot POST /api/applications
```

**What Happened:**
The endpoint doesn't exist or wasn't registered in the server.

**Root Cause:**

- Route file wasn't imported in `server.js`
- Wrong route path
- Typo in `app.use('/api/applications', ...)`

**How to Fix:**

```javascript
// In server.js, verify this exists:
const applicationsRoutes = require('./routes/applications');
app.use('/api/applications', applicationsRoutes);

// Check for typos in the path
// Restart the server
npm start
```

**Prevention:**

- Always import and register routes in `server.js`
- Write the route path exactly once, then copy it to avoid typos
- Test each endpoint immediately after creating it

---

### Error 8: 404 Not Found

**Error Message:**

```json
{"error":"Application not found"}
```

**What Happened:**
You tried to update or delete an application that doesn't exist.

**Root Cause:**

- Wrong application ID
- Application was already deleted
- Application belongs to a different user

**How to Fix:**

```bash
# Get all applications first:
curl -b cookies.txt http://localhost:5000/api/applications

# Use a valid ID from the list
# Then try the update/delete again
```

**Prevention:**

- Always verify the ID exists before updating/deleting
- Display the list of applications before asking user to pick one

---

### Error 9: Missing Required Fields

**Error Message:**

```json
{"error":"Missing required fields: user_id, company, position, date_applied"}
```

**What Happened:**
You tried to create an application without providing all required fields.

**Root Cause:**

- Request body is missing a field
- Field name is misspelled
- JSON syntax is wrong

**How to Fix:**

```bash
# Make sure ALL required fields are in the request:
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position": "SWE",
    "date_applied": "2024-01-15"
  }'

# Verify JSON syntax (proper quotes, commas, etc.)
```

**Prevention:**

- Read the error message carefully—it tells you which fields are missing
- Create a checklist of required fields before sending requests
- Validate data on the frontend before sending to the backend

---

## Testing & Curl Errors

### Error 10: Curl Syntax Error

**Error Message:**

```text
curl: (6) Could not resolve host
```

**What Happened:**
Curl couldn't reach the server.

**Root Cause:**

- Server isn't running
- Wrong URL
- Typo in localhost:5000

**How to Fix:**

```bash
# Check: Is the server running?
# In one terminal, run:
npm start

# In another terminal, verify the server is listening:
curl http://localhost:5000/api/test

# If not working, check the port (default is 5000):
# In .env, verify:
PORT=5000
```

**Prevention:**

- Always start the server in a separate terminal before testing
- Keep the server running in the background
- Test with `/api/test` endpoint first to verify server is alive

---

### Error 11: JSON Parse Error

**Error Message:**

```text
Unexpected end of JSON input
```

**What Happened:**
Curl sent invalid JSON.

**Root Cause:**

- Missing closing brace `}`
- Mismatched quotes
- Extra comma at the end of an array

**How to Fix:**

```bash
# Valid JSON:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Common mistakes to avoid:
# ❌ Trailing comma: {"email": "test@example.com",}
# ❌ Single quotes: {'email': 'test@example.com'}
# ❌ Missing brace: {"email": "test@example.com"
```

**Prevention:**

- Use a JSON validator (jsonlint.com) before sending
- Use your editor's JSON formatter
- Copy-paste JSON from trusted sources

---

### Error 12: Cookie Not Being Saved

**Error Message:**
(No obvious error, but next request says "not logged in")

**What Happened:**
You didn't use the `-c` flag when logging in.

**Root Cause:**

- Forgot to save cookies: `curl -c cookies.txt ...`
- Each curl request is independent

**How to Fix:**

```bash
# ALWAYS use these flags:
curl -c cookies.txt ...   # Save cookies
curl -b cookies.txt ...   # Send cookies

# Example flow:
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login ...
curl -b cookies.txt http://localhost:5000/api/applications
```

**Prevention:**

- Write a curl testing script with both flags
- Remember: `-c` saves, `-b` sends
- Test in a browser (which handles cookies automatically)

---

## Node.js & Express Setup Errors

### Error 13: "Cannot find module"

**Error Message:**

```text
Error: Cannot find module 'express'
```

**What Happened:**
A package isn't installed.

**Root Cause:**

- You didn't run `npm install`
- You installed in the wrong directory
- Package name is wrong

**How to Fix:**

```bash
# In backend/ directory:
npm install

# Or install specific packages:
npm install express pg bcrypt express-session

# Verify they're installed:
ls node_modules/

# Check package.json for dependencies:
cat package.json
```

**Prevention:**

- Always run `npm install` after cloning or starting a new project
- Keep `node_modules/` in `.gitignore` (don't commit it)

---

### Error 14: Port Already in Use

**Error Message:**

```text
Error: listen EADDRINUSE :::5000
```

**What Happened:**
Another process is using port 5000.

**Root Cause:**

- Server is already running in another terminal
- Old server process didn't stop cleanly

**How to Fix:**

```bash
# Find the process using port 5000:
lsof -i :5000

# Kill the process:
kill -9 <PID>

# Or just use a different port:
# In .env, change:
PORT=5001

# Then restart the server
npm start
```

**Prevention:**

- Keep the server in a visible terminal so you know it's running
- Use `Ctrl+C` to stop the server cleanly
- Use different ports if running multiple services

---

### Error 15: Environment Variables Not Loading

**Error Message:**

```text
undefined
```

**What Happened:**
`process.env.DATABASE_URL` is undefined.

**Root Cause:**

- `.env` file doesn't exist
- Typo in `.env`
- `require('dotenv').config()` wasn't called

**How to Fix:**

```javascript
// At the TOP of server.js:
require('dotenv').config();

// Then use:
const dbUrl = process.env.DATABASE_URL;
console.log(dbUrl); // Should print the URL, not undefined
```

**In `.env` file:**

```env
DATABASE_URL=postgresql://postgres@localhost:5432/computech_jobflow
NODE_ENV=development
PORT=5000
```

**Prevention:**

- Always load dotenv at the very top of your main file
- Never commit `.env` to Git (it has secrets)
- Add `.env` to `.gitignore`

---

## Quick Decision Tree

**Use this when you hit an error:**

```text
Error? 
├─ "violates foreign key constraint"
│  └─ → Error 1: Create the missing user in the database
│
├─ "does not exist" or "relation X does not exist"
│  └─ → Error 2 or 3: Run schema.sql or check column names
│
├─ "You must be logged in"
│  └─ → Error 4: Use -c and -b flags with curl
│
├─ "Cannot POST"
│  └─ → Error 7: Check routes are imported in server.js
│
├─ "Cannot find module"
│  └─ → Error 13: Run npm install
│
├─ "listen EADDRINUSE"
│  └─ → Error 14: Kill the old process or use a different port
│
└─ "JSON parse error" or syntax error
   └─ → Error 10 or 11: Validate JSON syntax
```

---

## Prevention Checklist

Before deploying or testing, verify:

- [ ] Schema file (`schema.sql`) exists and is committed
- [ ] `.env` file exists (NOT committed)
- [ ] `.gitignore` includes `node_modules/` and `.env`
- [ ] All packages are installed (`npm install`)
- [ ] Server starts without errors (`npm start`)
- [ ] Database is running (PostgreSQL)
- [ ] Test user exists in database
- [ ] All routes are imported in `server.js`
- [ ] Middleware is configured (sessions, etc.)
- [ ] Testing uses curl with `-c` and `-b` flags

---

## Future Projects Checklist

**When starting a new backend project, refer back to:**

1. **Database Setup**
   - Design schema first (use the worksheet)
   - Avoid copy-pasting templates (understand what you're copying)
   - Create test data before testing

2. **API Design**
   - Plan routes before coding
   - Use consistent naming (snake_case for database, camelCase for JS)
   - Test each endpoint immediately

3. **Authentication**
   - Always hash passwords (bcrypt)
   - Use sessions or JWT consistently
   - Protect sensitive routes with middleware
   - Test with curl using cookie flags

4. **Error Handling**
   - Return meaningful error messages
   - Use appropriate HTTP status codes (401, 404, 409, 500)
   - Log errors for debugging

5. **Testing**
   - Save scripts for common curl requests
   - Test in browser when cookies are involved
   - Create test users with known passwords

---

**Good luck on your next project!** 🚀
