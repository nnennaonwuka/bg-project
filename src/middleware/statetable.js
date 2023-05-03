const pool = require("../db");

const fs = require("fs");
const csv = require("csv-parser");

const uploadState = () => {
  const results = [];

  fs.createReadStream("./src/files/state table - state.csv")
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      console.log("CSV file successfully parsed.");
      console.log(results);

      results.forEach((row) => {
        const query = {
          text: "INSERT INTO state(state_id, state) VALUES($1, $2)",
          values: [row.state_id, row.state],
        };

        pool.query(query, (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(`Data inserted for row with state_id = ${row.state_id}.`);
        });
      });
    });
};

console.log(uploadState());
