const router = require("express").Router();
const friendController = require("../controllers/friend");
const Util = require("../../util/util");

router.post("/friends/befriend", Util.isAuth, Util.errorCatcher(friendController.postAddFriend));

router.get("/friends/requests", Util.isAuth, Util.errorCatcher(friendController.getRequests));

router.post("/friends/requests", Util.isAuth, Util.errorCatcher(friendController.acceptRequest));

router.delete("/friends/requests", Util.isAuth, Util.errorCatcher(friendController.deleteRequest));

router.get("/friends", Util.isAuth, Util.errorCatcher(friendController.getFriends));

module.exports = router;
