const knex = require("../db/connection");

function list() {
    return knex("tables").select("*").orderBy("table_name");
}

function read(table_id = 0) {
    return knex("tables").select("*").where({table_id: table_id}).first();
}

function create(table) {
    return knex("tables")
        .insert(table)
        .returning("*")
        .then((createdRecords) => createdRecords[0]);
}

function seat(table_id = 0, reservation_id = 0) {
    // console.log("TABLES SERVICE SEAT FN reservation_id: ", reservation_id);
    return knex("tables")
        .update({reservation_id: reservation_id})
        .where({table_id: table_id});
}

function unseat(table_id = 0) {
    // console.log("TABLES SERVICE SEAT FN reservation_id: ", reservation_id);
    return knex("tables")
        .update({reservation_id: null})
        .where({table_id: table_id});
}

function findTableWithReservation(reservation_id = 0) {
    return knex("tables")
        .select("table_id")
        .where({reservation_id: reservation_id})
        .first();
}

module.exports = {
    list,
    read,
    create,
    seat,
    unseat,
    findTableWithReservation,
};