const router = require("express").Router();
const msgController = require("../controllers/message");
const Util = require("../../util/util");

router.post("/messages/update", Util.errorCatcher(msgController.updateContent));

router.post("/messages/delete", Util.errorCatcher(msgController.deleteContent));

router.post("/messages/pin", Util.errorCatcher(msgController.pinContent));

router.post("/messages/unpin", Util.errorCatcher(msgController.unpinContent));

router.post("/messages/thumbs-up", Util.errorCatcher(msgController.postThumbsUp));

router.delete("/messages/thumbs-up", Util.errorCatcher(msgController.deleteThumbsUp));

router.post("/messages/read", Util.errorCatcher(msgController.postReadStatus));

router.get("/messages/mail", Util.isAuth, Util.errorCatcher(msgController.getMail));

router.get("/messages", Util.isAuth, Util.errorCatcher(msgController.getMessages));

module.exports = router;
