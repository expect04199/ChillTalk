const router = require("express").Router();
const channelController = require("../controllers/channel");
const Util = require("../../util/util");

router.get("/channels/details", Util.errorCatcher(channelController.getDetail));

router.post("/channels/create", Util.errorCatcher(channelController.createChannel));

module.exports = router;
