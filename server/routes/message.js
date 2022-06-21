const router = require("express").Router();
const messageController = require("../controllers/message");
const Util = require("../../util/util");

router.post("/messages/update", Util.errorCatcher(messageController.updateContent));

module.exports = router;
