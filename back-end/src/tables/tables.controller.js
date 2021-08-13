const asyncErrorBoundary = require('../errors/asyncErrorBoundary');
const hasProperties = require("../errors/hasProperties");
const tablesService = require("./tables.service");
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

module.exports = {
  list,
  create: [asyncErrorBoundary(hasOnlyValidProperties), hasRequired, create],
};
