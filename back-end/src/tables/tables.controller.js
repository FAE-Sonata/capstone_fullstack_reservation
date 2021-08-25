const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const tablesService = require("./tables.service");
const reservationsService = require("../reservations/reservations.service");
const VALID_PROPERTIES = ["table_name", "capacity"];
const hasRequired = hasProperties(...VALID_PROPERTIES);

async function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;
  const EXTENDED_VALID = VALID_PROPERTIES.concat("people");
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

async function tableExists(req, res, next) {
  const { table_id: table_id } = req.params;

  const table = await tablesService.read(table_id);

  if (table) {
    res.locals['table'] = table;
    return next();
  }
  next({ status: 404, message: `Table with id ${table_id} cannot be found.` });
}

async function validFormat(req, res, next) {
  const attemptedPost = ('data' in req.body) ? (req.body['data']) : (req.body);
  if(attemptedPost['table_name'].length < 2)
    return next(
      { status: 400, message: "'table_name' must be at least 2 characters." });
  const formCapacity = ('capacity' in attemptedPost) ?
    attemptedPost['capacity'] : attemptedPost['people'];
  if(typeof(formCapacity) !== "number" || formCapacity < 1 || formCapacity % 1)
    return next(
      { status: 400, message: "'capacity' must be a positive integer." });
  next();
}

async function isValidSeating(req, res, next) {
  const tableModified = res.locals['table'];
  if(tableModified) {
    if(tableModified['reservation_id']){
      return next(
        { status: 400,
          message: `Table ${tableModified['table_id']} occupied with seating` +
          ` ${tableModified['reservation_id']}` });
      }
    if(!req.body || !req.body.data)
      return next({ status: 400, message: "Malformed request." });
    const to_be_seated_id = req.body.data['reservation_id'];
    if(!to_be_seated_id && to_be_seated_id !== 0)
      return next({ status: 400, message: "No 'reservation_id' provided." });

    const reservation = await reservationsService.read(to_be_seated_id);
    if(!reservation || !Object.keys(reservation))
      return next(
        { status: 404, message: `No reservation with id ${to_be_seated_id}`});
    const partySize = reservation['people'];
    if(partySize > tableModified['capacity']) {
      return next(
        { status: 400,
          message: `Table capacity is ${tableModified['capacity']}. Cannot` +
          ` seat ${partySize}`});
    }
    return next();
  }
  // should not be reached
  next({ status: 404, message: "Table cannot be found." });
}

async function tableOccupied(req, res, next) {
  const tableArr = res.locals['table'];
  if(tableArr) {
    const reservation_id = tableArr['reservation_id'];
    if(!reservation_id && reservation_id !== 0) {
      return next(
        { status: 400,
          message: `Table ID ${tableArr['table_id']} not occupied.`});
      }
    return next();
  }
  // should not be reached
  next({ status: 404, message: "Table cannot be found." });
}

/**
 * List handler for table resources
 */
async function list(req, res) {
  let data = await tablesService.list();
  res.json({ data });
}

async function create(req, res, next) {
  let sent = ('data' in req.body) ? (req.body['data']) : (req.body);
  tablesService
    .create(sent)
    .then((data) => res.status(201).json({ data }))
    .catch(next);
}

/* similar to findTableWithReservation but to fail if there is a table
seated with the same reservation_id  */
async function isNotAlreadySeated(req, res, next) {
  const { reservation_id } = req.body['data'];
  const matchingTableId = await tablesService.findTableWithReservation(
    reservation_id);
  if(matchingTableId || matchingTableId === 0)
    return next(
      { status: 400,
        message: `Reservation with id ${reservation_id} already seated at` +
        ` table ${matchingTableId}.` });
  return next();
}

async function seat(req, res, next) {
  if(res.locals['table']){
    const { table_id } = req.params;
    const affectedReservation = req.body.data['reservation_id'];
    await reservationsService.updateStatus(affectedReservation, "seated");
    tablesService
      .seat(table_id, affectedReservation)
      .then((data) => res.status(200).json({ data }))
      .catch(next);
  }
}

async function unseat(req, res, next) {
  if(res.locals['table']){
    const { table_id } = req.params;
    const affectedReservation = res.locals['table']['reservation_id'];
    await reservationsService.updateStatus(affectedReservation, "finished");
    tablesService
      .unseat(table_id)
      .then((data) => res.status(200).json({ data }))
      .catch(next);
  }
}

async function hasValidStatus(req, res, next) {
  const { reservation_id } = req.params;
  const reservation = await reservationsService.read(reservation_id);
  if(!Object.keys(reservation).length) {
    return next(
      { status: 400, message: `No reservation with id ${reservation_id}.`});
  }
  const reservationStatus = reservation['status'];
  if(reservationStatus.toLowerCase() !== "seated") {
    return next(
      { status: 400,
        message: "Attempting to find matching table when reservation status" +
        ` is: ${reservationStatus}`});
  }
  return next();
}

async function findTableWithReservation(req, res, next) {
  const { reservation_id } = req.params;
  tablesService
    .findTableWithReservation(reservation_id)
    .then((data) => res.status(200).json({ data }))
    .catch(next);
}

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired,
    asyncErrorBoundary(validFormat), create],
  seat: [asyncErrorBoundary(tableExists), asyncErrorBoundary(isNotAlreadySeated),
    asyncErrorBoundary(isValidSeating), seat],
  unseat: [asyncErrorBoundary(tableExists), asyncErrorBoundary(tableOccupied),
    unseat],
  findTableWithReservation: [asyncErrorBoundary(hasValidStatus),
    asyncErrorBoundary(findTableWithReservation)],
};