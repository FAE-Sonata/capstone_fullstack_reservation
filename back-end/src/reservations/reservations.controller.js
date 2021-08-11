const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const reservationsService = require("./reservations.service");
const VALID_PROPERTIES = ["first_name", "last_name", "mobile_number",
  "reservation_date", "reservation_time", "people"];
const hasRequired = hasProperties(...VALID_PROPERTIES); /*[0], VALID_PROPERTIES[1],
  VALID_PROPERTIES[2], VALID_PROPERTIES[3], VALID_PROPERTIES[4],
  VALID_PROPERTIES[5]);*/

async function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;

  const invalidFields = Object.keys(data).filter(
    (field) => !VALID_PROPERTIES.includes(field)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
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

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired, create],
};
