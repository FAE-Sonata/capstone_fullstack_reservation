const knex = require("../db/connection");

function list() {
    return knex("reservations").select("*");
}

function listByDate(selectedDate) {
    return knex("reservations").select("*").where({reservation_date: selectedDate});
}

function create(reservation) {
    // suggestion: if "reservation" is empty, throw Error
    return knex("reservations")
        .insert(reservation)
        .returning("*")
        .then((createdRecords) => createdRecords[0]);
}

function read(reservation_id = 0) {
    return knex("reservations").where({reservation_id: reservation_id});
}

function updateStatus(reservation_id = 0, newStatus) {
    return knex("reservations")
        .update({status: newStatus.trim().toLowerCase() })
        .where({reservation_id: reservation_id});
}

module.exports = {
    list,
    listByDate,
    create,
    read,
    updateStatus,
};