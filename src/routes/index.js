/**
 * @description - Load Routes for All Module
 */
const path = require("path");
const glob = require("glob");
const fs = require("fs");

module.exports = function (app, express) {
  try {

    const routePath = fs.readdirSync(path.resolve(`${__dirname}/admin`));
    routePath.forEach((module) => {
      require(`./admin/${module}`);
    });

  } catch (error) {
    console.log("Error -->", error);
  }
};
