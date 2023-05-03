/* Replace with your SQL commands */
CREATE TABLE IF NOT EXISTS operator_product (
    operator_id VARCHAR(255) REFERENCES operators (operator_id),
    product_name VARCHAR(20) REFERENCES products (product_name),
    seed_name VARCHAR(50) REFERENCES seeds (seed_name)
    --UNIQUE (operator_id, product_name, seed_name)
);