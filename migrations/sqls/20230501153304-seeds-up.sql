/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS seeds (
    seed_id SERIAL PRIMARY KEY,
    seed_name VARCHAR(50) UNIQUE,
    product_id INTEGER REFERENCES products(product_id)
);