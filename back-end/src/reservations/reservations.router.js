/**
 * Defines the router for reservation resources.
 *
 * @type {Router}
 */

const router = require("express").Router();
const methodNotAllowed = require("../errors/methodNotAllowed");
const controller = require("./reservations.controller");

router.route("/").get(controller.list);
router.route("/new").post(controller['create']).all(methodNotAllowed);

module.exports = router;
