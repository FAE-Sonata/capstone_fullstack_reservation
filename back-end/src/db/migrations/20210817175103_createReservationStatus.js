exports.up = function(knex) {
    return knex.schema.table('reservations', function (table) {
        table.string('status'); // booked, seated, or finished
      });
};

exports.down = function(knex) {
    return knex.schema.table('reservations', (table) => {
        table.dropColumn('status');
    });
};