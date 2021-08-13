const sample = require("./01-tables.json");
exports.seed = function (knex) {
  return knex("tables").insert(sample);
};