const router = require("express").Router();
const channelController = require("../controllers/channel");
const Util = require("../../util/util");

router.get("/channels/pin-messages", Util.isAuth, Util.errorCatcher(channelController.getPinMessages));

router.post("/channels", Util.isAuth, Util.errorCatcher(channelController.createChannel));

module.exports = router;
