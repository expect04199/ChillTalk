const router = require("express").Router();
const userController = require("../controllers/user");
const Util = require("../../util/util");

router.post("/users/signin", Util.errorCatcher(userController.postSignin));

router.post("/users/signup", Util.errorCatcher(userController.postSignup));

module.exports = router;
