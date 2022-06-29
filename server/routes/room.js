const router = require("express").Router();
const multer = require("multer");
const roomController = require("../controllers/room");
const Util = require("../../util/util");
const upload = multer({
  limit: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      cb(null, false);
    }
    cb(null, true);
  },
});

router.get("/rooms/details", Util.errorCatcher(roomController.getDetail));

router.post("/rooms/join", Util.errorCatcher(roomController.postJoinRoom));

router.post(
  "/rooms/create",
  upload.array("picture"),
  Util.errorCatcher(roomController.postCreateRoom)
);

router.get("/rooms/search", Util.errorCatcher(roomController.getSearchResult));
module.exports = router;
