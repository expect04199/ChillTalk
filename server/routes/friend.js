const router = require("express").Router();
const friendController = require("../controllers/friend");
const Util = require("../../util/util");

router.post("/friends/befriend", Util.isAuth, Util.errorCatcher(friendController.postAddFriend));

module.exports = router;
