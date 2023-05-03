const pool = require("../db");

const fs = require("fs");
const csv = require("csv-parser");

const uploadLGA = () => {
  const results = [];

  fs.createReadStream(
    "./src/files/local government table - list_of_local_government_areas_of_nigeria-1729j.csv"
  )
    .pipe(csv())
    .on("data", (data) => {
      results.push(data);
    })
    .on("end", () => {
      console.log("CSV file successfully parsed.");
      console.log(results);

      results.forEach((row) => {
        const query = {
          text: "INSERT INTO lga(lga_id, lga, state_id) VALUES($1, $2, $3)",
          values: [row.lga_id, row.lga, row.state_id],
        };

        pool.query(query, (err, res) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log(`Data inserted for row with lga_id = ${row.lga_id}.`);
        });
      });
    });
};

console.log(uploadLGA());
