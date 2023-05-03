/* Replace with your SQL commands */
CREATE FUNCTION generate_operator_id(id INTEGER)
   RETURNS VARCHAR(255)
   IMMUTABLE
 AS $$
   SELECT CONCAT('0-', id);
 $$ LANGUAGE SQL;


CREATE TABLE IF NOT EXISTS operators (
  id SERIAL PRIMARY KEY,
  operator_id VARCHAR(255) GENERATED ALWAYS AS (generate_operator_id(id)) STORED UNIQUE,
  user_id INTEGER REFERENCES users (user_id),
  fullname VARCHAR(255) REFERENCES users (fullname),
  password VARCHAR(255) REFERENCES users (password),
  email VARCHAR(255) REFERENCES users (email),
  phonenumber VARCHAR(20),
  nationality VARCHAR(30),
  state VARCHAR(50) REFERENCES state (state),
  lga VARCHAR(255),
  sex VARCHAR(10),
  date_of_birth DATE,
  NIN VARCHAR(20),
  "file" BYTEA,
  image_name VARCHAR(50),
  isverified BOOLEAN
  --UNIQUE (user_id, fullname, password, email, state)
);
