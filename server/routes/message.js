const router = require("express").Router();
const messageController = require("../controllers/message");
const Util = require("../../util/util");

router.post("/messages/update", Util.errorCatcher(messageController.updateContent));

router.post("/messages/delete", Util.errorCatcher(messageController.deleteContent));

module.exports = router;
