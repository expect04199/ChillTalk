const router = require("express").Router();
const userController = require("../controllers/user");
const Util = require("../../util/util");
const multer = require("multer");
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

router.post("/users/signin", Util.errorCatcher(userController.postSignin));

router.post("/users/signup", Util.errorCatcher(userController.postSignup));

router.get("/users/info", Util.isAuth, Util.errorCatcher(userController.getInfo));

router.patch(
  "/users/info",
  Util.isAuth,
  upload.fields([
    { name: "picture", maxCount: 1 },
    { name: "background", maxCount: 1 },
  ]),
  Util.errorCatcher(userController.updateInfo)
);

module.exports = router;
