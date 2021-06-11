/** Database setup for BizTime. */

const { Client } = require("pg");

const DB_URI = (process.env.NODE_ENV === "test")
    ? "postgresql:///biztime_test"
    : "postgresql:///biztime";

//   if (process.env.NODE_ENV === "test") {
//     DB_URI = "postgresql:///biztime_test";
//   } else {
//     DB_URI = "postgresql:///biztime_test";
//   }

let db = new Client({
    connectionString: DB_URI
});

db.connect();

module.exports = db;