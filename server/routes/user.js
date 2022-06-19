const router = require("express").Router();
const userController = require("../controllers/user");

router.post("/users/signin", userController.postSignin);

router.post("/users/signup", userController.postSignup);

module.exports = router;
