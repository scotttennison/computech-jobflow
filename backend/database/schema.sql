-- User table: stores account info
CREATE TABLE users(
   id SERIAL PRIMARY KEY,
   email VARCHAR(100) UNIQUE NOT NULL,
   password_hash VARCHAR(255) NOT NULL,
   first_name VARCHAR(50),
   last_name VARCHAR(50),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Applications table: tracks job applications per user
CREATE TABLE applications(
   id SERIAL PRIMARY KEY,
   user_id INT NOT NULL,
   company VARCHAR(100) NOT NULL,
   position VARCHAR(150) NOT NULL,
   status VARCHAR(20) NOT NULL DEFAULT 'Applied',
   date_applied DATE NOT NULL,
   follow_up_date DATE,
   notes TEXT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


   -- Links applications to users
   FOREIGN KEY (user_id) REFERENCES users(id)
);