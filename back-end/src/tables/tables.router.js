/**
 * Defines the router for table resources.
 *
 * @type {Router}
 */

 const router = require("express").Router();
 const methodNotAllowed = require("../errors/methodNotAllowed");
 const controller = require("./tables.controller");
 
 router.route("/").get(controller.list).all(methodNotAllowed);
 router.route("/:table_id/seat").put(controller.seat).all(methodNotAllowed);
 router.route("/new").post(controller['create']).all(methodNotAllowed);
 
 module.exports = router;