const { S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
const aws = require("aws-sdk");

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
};
