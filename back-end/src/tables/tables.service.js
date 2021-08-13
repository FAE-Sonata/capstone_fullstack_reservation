const knex = require("../db/connection");

function list() {
    return knex("tables").select("*");
}

function read(table_id = 0) {
    return knex("tables").select("*").where({table_id: table_id});
}

function create(table) {
    return knex("tables")
        .insert(table)
        .returning("*")
        .then((createdRecords) => createdRecords[0]);
}

module.exports = {
    list,
    read,
    create,
};