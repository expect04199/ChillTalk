const { S3_ACCESS_KEY, S3_SECRET_KEY, TOKEN_SECRET } = process.env;
const aws = require("aws-sdk");
const jwt = require("jsonwebtoken");

const { CDN_IP } = process.env;

module.exports = class Util {
  static async imageUpload(files, src, srcId, type) {
    const s3 = new aws.S3({
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    });

    for (let file of files) {
      const data = {
        Bucket: "chilltalk",
        Key: `${src}/${srcId}/${type}/${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      await s3.upload(data).promise();
    }
    return true;
  }

  static errorCatcher(cb) {
    return function (req, res, next) {
      cb(req, res, next).catch(next);
    };
  }

  static isAuth(req, res, next) {
    let accessToken = req.get("Authorization");
    if (!accessToken) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    accessToken = accessToken.replace("Bearer ", "");
    if (accessToken == "null") {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
    const user = jwt.verify(accessToken, TOKEN_SECRET);
    req.user = user.info;
    return next();
  }

  static getImage(preset, src, id, type, img) {
    let image = preset
      ? `${CDN_IP}/preset/1/${type}/${img}`
      : `${CDN_IP}/${src}/${id}/${type}/${img}`;
    return image;
  }
};
