const router = require("express").Router();
const messageController = require("../controllers/message");
const Util = require("../../util/util");

router.post("/messages/update", Util.errorCatcher(messageController.updateContent));

router.post("/messages/delete", Util.errorCatcher(messageController.deleteContent));

router.post("/messages/pin", Util.errorCatcher(messageController.pinContent));

router.post("/messages/unpin", Util.errorCatcher(messageController.unpinContent));

router.post("/messages/thumbs-up", Util.errorCatcher(messageController.postThumbsUp));

router.delete("/messages/thumbs-up", Util.errorCatcher(messageController.deleteThumbsUp));

module.exports = router;
