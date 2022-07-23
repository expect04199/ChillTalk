const router = require("express").Router();
const msgController = require("../controllers/message");
const Util = require("../../util/util");

router.post("/messages/pin", Util.isAuth, Util.errorCatcher(msgController.pinContent));

router.post("/messages/unpin", Util.isAuth, Util.errorCatcher(msgController.unpinContent));

router.post("/messages/thumbs-up", Util.isAuth, Util.errorCatcher(msgController.postLike));

router.delete("/messages/thumbs-up", Util.isAuth, Util.errorCatcher(msgController.deleteLike));

router.post("/messages/read", Util.isAuth, Util.errorCatcher(msgController.postReadStatus));

router.get("/messages/mail", Util.isAuth, Util.errorCatcher(msgController.getMail));

router.get("/messages", Util.isAuth, Util.errorCatcher(msgController.getMessages));

router.put("/messages", Util.isAuth, Util.errorCatcher(msgController.updateMessage));

router.delete("/messages", Util.isAuth, Util.errorCatcher(msgController.deleteMessage));

module.exports = router;
