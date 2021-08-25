/**
 * Defines the router for reservation resources.
 *
 * @type {Router}
 */

const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./reservations.controller");

router.route("/")
  .get(controller['list'])
  .post(controller['create'])
  .all(methodNotAllowed);
router
  .route("/:reservation_id([0-9]+)") // only allow digits for input
  .get(controller['read'])
  .put(controller['update'])
  .all(methodNotAllowed);
  router
  .route("/:reservation_id([0-9]+)/status") // only allow digits for input
  .put(controller['updateStatus'])
  .all(methodNotAllowed);
router.route("/new").post(controller['create']).all(methodNotAllowed);

module.exports = router;