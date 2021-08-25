const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("./reservations.service");
const VALID_PROPERTIES = ["first_name", "last_name", "mobile_number",
  "reservation_date", "reservation_time", "people"];
const VALID_STATUS = ["booked", "seated", "finished", "cancelled"];
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
  if (reservation && (reservation.length || Object.keys(reservation).length)) {
    res.locals['reservation'] = reservation;
    return next();
  }
  next({ status: 404, message: `Reservation id ${reservation_id} cannot be found.` });
}

/**
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns a next() with an error if the body status is not one of the 4
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
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns next() with an error status if any one of the input formats is invalid
 */
async function validFormat(req, res, next) {
  const attemptedPost = req.body['data'];
  const formPeople = attemptedPost['people'];
  if(typeof(formPeople) !== "number" || formPeople < 1 || formPeople % 1)
    return next(
      { status: 400, message: "'people' must be a positive integer." });
  const dateRegex = new RegExp(/^[1-9]\d*\-[0-1]\d\-[0-3]\d$/);
  const timeRegex = new RegExp(/^[0-2]?\d\:[0-5]\d$/);
  if(!dateRegex.test(attemptedPost['reservation_date']))
    return next(
      { status: 400,
        message: "'reservation_date' must be in yyyy-mm-dd format."});
  if(!timeRegex.test(attemptedPost['reservation_time']))
    return next(
      { status: 400,
        message: "'reservation_time' must be in HH:mm format." });
  next();
}

async function validTime(req, res, next) {
  const attemptedPost = req.body['data'];
  const CURRENT_TIME = new Date();
  const postTimeObj = new Date(
    [attemptedPost['reservation_date'],
      attemptedPost['reservation_time']].join(" "));
  if(postTimeObj < CURRENT_TIME) {
    return next(
      { status: 400,
        message: "reservation date and time must be in the future." });
  }
  if(postTimeObj.getDay() === 2) {
    return next(
      { status: 400,
        message: "reservation date cannot be on a Tuesday; restaurant is " +
        "closed on Tuesdays." });
  }
  next();
}

/**
 * List handler for reservation resources
 */
async function list(req, res) {
  let data = undefined;
  const selectedDate = req.query['date'];
  const phoneSearch = req.query['mobile_phone'];
  if(selectedDate) data = await reservationsService.listByDate(selectedDate);
  else if(phoneSearch) data = await reservationsService.search(phoneSearch);
  else data = await reservationsService.list();
  res.json({ data });
}

async function create(req, res, next) {
  let sent = ('data' in req.body) ? (req.body['data']) : (req.body);
  reservationsService
    .create(sent)
    .then((data) => res.status(201).json({ data }))
    .catch(next);
}

async function read(req, res) {
  res.json({ data: res.locals['reservation'] });
}

async function update(req, res, next) {
  /* assumed to have reservation_id from ReservationForm.js handleSubmit()
  branch */
  const updatedReservation = req.body['data'];
  const data = await reservationsService.update(updatedReservation);
  res.json({ data });
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
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired,
    asyncErrorBoundary(validFormat), asyncErrorBoundary(validTime), create],
  read: [asyncErrorBoundary(reservationExists), read],
  update: [asyncErrorBoundary(reservationExists), asyncErrorBoundary(update)],
  updateStatus: [asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(isValidStatus), updateStatus],
};