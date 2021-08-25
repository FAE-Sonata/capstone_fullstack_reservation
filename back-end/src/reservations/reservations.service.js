const knex = require("../db/connection");

function list() {
    return knex("reservations").select("*");
}

function listByDate(selectedDate) {
    return knex("reservations")
        .select("*")
        .where({reservation_date: selectedDate})
        .orderBy("reservation_time");
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

function update(updatedReservation) {
    return knex("reservations")
      .select("*")
      .where({ reservation_id: updatedReservation['reservation_id']  })
      .update(updatedReservation, "*");
}

function updateStatus(reservation_id = 0, newStatus) {
    return knex("reservations")
        .update({status: newStatus.trim().toLowerCase() })
        .where({reservation_id: reservation_id});
}

function search(mobile_number) {
    return knex("reservations")
      .whereRaw(
        "translate(mobile_number, '() -', '') like ?",
        `%${mobile_number.replace(/\D/g, "")}%`
      )
      .orderBy("reservation_date");
}

module.exports = {
    list,
    listByDate,
    create,
    read,
    updateStatus,
    update,
    search,
};