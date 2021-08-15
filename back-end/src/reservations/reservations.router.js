/**
 * Defines the router for reservation resources.
 *
 * @type {Router}
 */

const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./reservations.controller");

router.route("/").get(controller.list).all(methodNotAllowed);
router
  .route("/:reservation_id([0-9]+)") // only allow digits for input
  .get(controller.read)
  .all(methodNotAllowed);
router.route("/new").post(controller['create']).all(methodNotAllowed);

module.exports = router;
