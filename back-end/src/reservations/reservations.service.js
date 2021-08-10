const knex = require("../db/connection");

function list() {
    return knex("reservations").select("*");
}

function listByDate(selectedDate) {
    return knex("reservations").select("*").where({reservation_date: selectedDate});
}

function create(reservation) {
    return knex("reservations")
        .insert(reservation)
        .returning("*")
        .then((createdRecords) => createdRecords[0]);
}

module.exports = {
    list,
    listByDate,
    create,
};