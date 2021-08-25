const sample = require("./00-reservations.json");
exports.seed = async function (knex) {
  await knex.raw("TRUNCATE TABLE reservations RESTART IDENTITY CASCADE");
  return knex("reservations").insert(sample);
};