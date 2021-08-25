/**
 * Creates a middleware function that validates that req.body.data has the specified non-falsey properties.
 * @param properties
 *  one or more property name strings.
 * @returns {function(*, *, *): void}
 *    a middleware function that validates that req.body.data has the specified non-falsey properties.
 */
function hasProperties(...properties) {
  return function (res, req, next) {
    let data = res.body;
    if('data' in res.body) data = res.body['data']; // for Postman format
    try {
      properties.forEach((property) => {
        const value = data[property];
        if (!value && value !== 0) {
          const error = new Error(`A '${property}' property is required.`);
          error.status = 400;
          throw error;
        }
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = hasProperties;