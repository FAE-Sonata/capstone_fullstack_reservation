const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("./reservations.service");
const VALID_PROPERTIES = ["first_name", "last_name", "mobile_number",
  "reservation_date", "reservation_time", "people"];
const hasRequired = hasProperties(...VALID_PROPERTIES);

async function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 500,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}

async function reservationExists(req, res, next) {
  const { reservation_id: reservation_id } = req.params;

  const reservation = await reservationsService.read(reservation_id);

  if (reservation) {
    res.locals['reservation'] = reservation;
    return next();
  }
  next({ status: 404, message: "Reservation cannot be found." });
}

/**
 * List handler for reservation resources
 */
async function list(req, res) {
  let data = await reservationsService.list();
  const selectedDate = req.query['date'];
  if(selectedDate) data = await reservationsService.listByDate(selectedDate);
  res.json({ data });
}

async function create(req, res, next) {
  reservationsService
    .create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch(next);
}

async function read(req, res) {
  res.json({ data: res.locals['reservation'] });
}

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired, create],
  read: [asyncErrorBoundary(reservationExists), read],
};
