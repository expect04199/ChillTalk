const router = require("express").Router();
const multer = require("multer");
const roomController = require("../controllers/room");
const Util = require("../../util/util");
const upload = multer({
  limit: {
    // 限制上傳檔案的大小為 1MB
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    // 只接受三種圖片格式
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
