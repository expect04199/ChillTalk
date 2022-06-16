const router = require("express").Router();
const channelController = require("../controllers/channel");

router.get("/channels/details", channelController.getDetail);

module.exports = router;
