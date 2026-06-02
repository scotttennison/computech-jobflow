# Database Schema

The app uses PostgreSQL with two core tables:

- **users**: Stores account info (email, hashed password, timestamps)
- **applications**: Stores job applications linked to users

┌─────────────────────┐
│      USERS          │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password_hash       │
│ first_name          │
│ last_name           │
│ created_at          │
└─────────────────────┘
       │
       │ one-to-many
       │ (1 user has many applications)
       │
       ▼
┌─────────────────────┐
│   APPLICATIONS      │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK) ───────┼──→ references users.id
│ company             │
│ position            │
│ status              │
│ date_applied        │
│ follow_up_date      │
│ notes               │
│ created_at          │
│ updated_at          │
└─────────────────────┘

## Why This Design?

- One user can have many applications (one-to-many relationship)
- Status is a simple field (not a separate table) for MVP simplicity
- Foreign key ensures data integrity and prevents orphaned records
- Timestamps track when entries are created and updated for analytics
