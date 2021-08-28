const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("./reservations.service");
const VALID_PROPERTIES = ["first_name", "last_name", "mobile_number",
  "reservation_date", "reservation_time", "people"];
const VALID_STATUS = ["booked", "seated", "finished", "cancelled"];
const hasRequired = hasProperties(...VALID_PROPERTIES);
const RANGE_TIMES = ["10:30", "21:30"];

async function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;
  const EXTENDED_VALID = VALID_PROPERTIES.concat("status");
  const invalidFields = Object.keys(data).filter(
    (field) => !EXTENDED_VALID.includes(field)
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

/* Validation middleware for PUT (updateStatus) method;
checks status being updated is valid */
async function isValidStatus(req, res, next) {
  if(req.body && req.body['data'] && req.body['data']['status']) {
    const newStatus = req.body['data']['status'].trim().toLowerCase();
    if(!VALID_STATUS.includes(newStatus))
      return next({status: 400, message: `Invalid status: ${newStatus}`});
    const existing = res.locals['reservation'];
    if(existing['status'] === "finished" && (newStatus !== "finished"))
      return next(
        { status: 400,
          message: "Cannot alter status for finished reservation (id " + 
          `${existing['reservation_id']}).`});
    return next();
  }
  next({ status: 400, message: "Request must contain status." });
}

/* Validation middleware for POST (create) method */
async function validFormat(req, res, next) {
  const attemptedPost = ('data' in req.body) ? (req.body['data']) : (req.body);
  const formPeople = attemptedPost['people'];
  if(typeof(formPeople) !== "number" || formPeople < 1 || formPeople % 1)
    return next(
      { status: 400, message: "'people' must be a positive integer." });
  const dateRegex = new RegExp(/^[1-9]\d*\-[0-1]\d\-[0-3]\d$/);
  const timeRegex = new RegExp(/^[0-2]?\d\:[0-5]\d(\:00)?$/);
  if(!dateRegex.test(attemptedPost['reservation_date']))
    return next(
      { status: 400,
        message: "'reservation_date' must be in yyyy-mm-dd format."});
  if(!timeRegex.test(attemptedPost['reservation_time']))
    return next(
      { status: 400,
        message: "'reservation_time' must be in HH:mm format." });
  // new reservation must have status == booked
  if('status' in attemptedPost) {
    const inputStatus = attemptedPost['status'];
    // will satisfy 1st loop if status == null
    if(inputStatus && inputStatus.toLowerCase() !== "booked")
      return next(
        { status: 400,
          message: `'status' must be 'booked', was: ${inputStatus}`});
  }
  next();
}

async function validTime(req, res, next) {
  const attemptedPost = ('data' in req.body) ? (req.body['data']) : (req.body);
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
  const postDateSplit = attemptedPost['reservation_date'].split("-");
  const postYear = parseInt(postDateSplit[0]);
  const postMonth = parseInt(postDateSplit[1])-1;
  const postDay = parseInt(postDateSplit[2]);
  const EARLIEST_SPLIT = RANGE_TIMES[0].split(":").map(x => parseInt(x));
  const EARLIEST_TIME = new Date(postYear, postMonth, postDay,
    EARLIEST_SPLIT[0], EARLIEST_SPLIT[1]);
  const LATEST_SPLIT = RANGE_TIMES[1].split(":").map(x => parseInt(x));
  const LATEST_TIME = new Date(postYear, postMonth, postDay, LATEST_SPLIT[0],
    LATEST_SPLIT[1]);

  if(postTimeObj < EARLIEST_TIME || postTimeObj > LATEST_TIME) {
      return next({ status: 400,
        message: `reservation time must be between ${RANGE_TIMES[0]} and ` +
          `${RANGE_TIMES[1]}.`});
  }
  next();
}

/**
 * List handler for reservation resources
 */
async function list(req, res) {
  let data = undefined;
  const selectedDate = req.query['date'];
  const phoneSearch = req.query['mobile_phone'] || req.query['mobile_number'];
  if(selectedDate) {
    data = await reservationsService.listByDate(selectedDate);
    data = data.filter(x => x['status'] !== "finished");
  }
  else if(phoneSearch) data = await reservationsService.search(phoneSearch);
  else data = await reservationsService.list();
  res.json({ data });
}

async function create(req, res, next) {
  let sent = ('data' in req.body) ? (req.body['data']) : (req.body);
  sent['status'] = "booked";
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
  res.json({ data: data[0] });
}

async function updateStatus(req, res, next) {
  if(res.locals['reservation']){
    const { reservation_id } = req.params;
    const newStatus = req.body['data']['status'];
    reservationsService
      .updateStatus(reservation_id, newStatus)
      .then(() => res.status(200).json({ data: {status: newStatus} }))
      .catch(next);
  }
}

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired,
    asyncErrorBoundary(validFormat), asyncErrorBoundary(validTime), create],
  read: [asyncErrorBoundary(reservationExists), read],
  update: [asyncErrorBoundary(reservationExists), hasRequired,
    asyncErrorBoundary(validFormat), asyncErrorBoundary(validTime),
    asyncErrorBoundary(update)],
  updateStatus: [asyncErrorBoundary(reservationExists),
    asyncErrorBoundary(isValidStatus), updateStatus],
};