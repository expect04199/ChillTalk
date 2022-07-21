require("dotenv").config();
const app = require("../app");
const chai = require("chai");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const chaiHttp = require("chai-http");
const { NODE_ENV } = process.env;
const { truncateData, createData } = require("./test_util");

chai.use(chaiHttp);
chai.use(deepEqualInAnyOrder);

const assert = chai.assert;
const expect = chai.expect;
const requester = chai.request(app).keepOpen();

before(async () => {
  if (NODE_ENV !== "test") {
    throw "Not in test env";
  }

  await truncateData();
  await createData();
});

module.exports = {
  expect,
  assert,
  requester,
};
