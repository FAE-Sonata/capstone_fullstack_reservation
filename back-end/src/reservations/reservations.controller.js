const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("./reservations.service");
const VALID_PROPERTIES = ["first_name", "last_name", "mobile_number",
  "reservation_date", "reservation_time", "people"];
const VALID_STATUS = ["booked", "seated", "finished"];
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
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns a next() with an error if the body status is not one of the 3
 * acceptable options
 */
async function isValidStatus(req, res, next) {
  if(req.body && req.body['data'] && req.body['data']['status']) {
    const newStatus = req.body['data']['status'].trim().toLowerCase();
    if(!VALID_STATUS.includes(newStatus))
      return next({status: 500,
        message: `Status must be one of ${VALID_STATUS}`});
    return next();
  }
  next({ status: 400, message: "Request must contain status." });
}

/**
 * List handler for reservation resources
 */
async function list(req, res) {
  let data = await reservationsService.list();
  const selectedDate = req.query['date'];
  const phoneSearch = req.query['mobile_phone'];
  if(selectedDate) data = await reservationsService.listByDate(selectedDate);
  if(phoneSearch) data = await reservationsService.search(phoneSearch);
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

async function updateStatus(req, res, next) {
  if(res.locals['reservation']){
    const { reservation_id } = req.params;
    reservationsService
      .updateStatus(reservation_id, req.body['data']['status'])
      .then((data) => res.status(201).json({ data }))
      .catch(next);
  }
}

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired, create],
  read: [asyncErrorBoundary(reservationExists), read],
  updateStatus: [asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(isValidStatus), updateStatus],
};