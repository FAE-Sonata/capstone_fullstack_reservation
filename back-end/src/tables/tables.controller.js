const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const tablesService = require("./tables.service");
const reservationsService = require("../reservations/reservations.service");
const VALID_PROPERTIES = ["table_name", "capacity"];
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

async function tableExists(req, res, next) {
  const { table_id: table_id } = req.params;

  const table = await tablesService.read(table_id);

  if (table) {
    res.locals['table'] = table;
    return next();
  }
  next({ status: 404, message: "Table cannot be found." });
}

async function isValidSeating(req, res, next) {
  const tableArr = res.locals['table'];
  if(tableArr) {
    const table = tableArr[0];
    if(!req.body || !req.body.data)
      return next({ status: 400, message: "Malformed request." });
    const reservation_id = req.body.data['reservation_id'];
    if(!reservation_id && reservation_id !== 0)
      return next({ status: 400, message: "No 'reservation_id' provided." });

    const reservation = await reservationsService.read(reservation_id);
    const partySize = reservation[0]['people'];
    if(partySize > table['capacity']) {
      return next({ status: 500,
        message: `Table capacity is ${table['capacity']}. ` +
          `Cannot seat ${partySize}`});
    }
    return next();
  }
  next({ status: 404, message: "Table cannot be found." });
}

/**
 * List handler for table resources
 */
async function list(req, res) {
  let data = await tablesService.list();
//   const selectedDate = req.query['date'];
//   if(selectedDate) data = await tablesService.listByDate(selectedDate);
  res.json({ data });
}

async function create(req, res, next) {
  tablesService
    .create(req.body)
    .then((data) => res.status(201).json({ data }))
    .catch(next);
}

async function seat(req, res, next) {
  if(res.locals['table']){
    const { table_id } = req.params;
    tablesService
      .seat(table_id, req.body.data['reservation_id'])
      .then((data) => res.status(201).json({ data }))
      .catch(next);
  }
}

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired, create],
  seat: [asyncErrorBoundary(tableExists), asyncErrorBoundary(isValidSeating),
    seat],
};