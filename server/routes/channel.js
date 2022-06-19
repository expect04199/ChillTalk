const router = require("express").Router();
const channelController = require("../controllers/channel");

router.get("/channels/details", channelController.getDetail);

router.post("/channels/create", channelController.createChannel);

module.exports = router;
