/**
 * Defines the router for table resources.
 *
 * @type {Router}
 */

 const router = require("express").Router();
 const methodNotAllowed = require("../errors/methodNotAllowed");
 const controller = require("./tables.controller");
 
 router.route("/").get(controller.list);
 router.route("/:table_id/seat").put(controller.seat);
 router.route("/new").post(controller['create']).all(methodNotAllowed);
 
 module.exports = router;