/**
 *	@description - Handle File Upload and File Logger
 */
const constant = require("../../constant");

const fs = require("fs");
const path = require("path");
const DateTime = require("./DateTime");
const dateTime = new DateTime();
class FileUtility {
  /**
   * @description - Uploading File
   * @param {Files} files data of file or files
   * @param {String} dir path of directory where to upload data
   * @param {String} name name of file to be generate for newly uploaded file.
   * @return {Object} responseObject with status,message and data(array of all uploaded files path)
   */
  async upload(files, dir, name = "") {
    var promise = new Promise(function (resolve, reject) {
      var file_path_list = [];
      try {
        if (files) {
          let _files = [].concat(files);
          async.eachSeries(
            _files,
            function (file, next) {
              if (constant.MIME_TYPES.indexOf(file.mimetype) >= 0) {
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir);
                }
                let filename = "";
                const fileSplit = file.name.split(".");
                try {
                  filename = fileSplit[0].replace(/\s/g, "_") + new Date().getTime() + "." + fileSplit.pop();
                } catch (error) {
                  filename = name + new Date().getTime() + "." + fileSplit.pop();
                }
                file.mv(dir + "/" + filename, (err) => {
                  if (err) {
                  } else {
                    location = dir + "/" + filename;
                    file_path_list.push(location);
                    next();
                  }
                });
              } else {
                next();
              }
            },
            function () {
              resolve({ status: 1, message: `Image uploaded`, data: file_path_list });
            }
          );
        } else {
          reject({ status: 0, message: "No Image selected" });
        }
      } catch (error) {
        reject({ status: 0, message: "No Image selected" });
      }
    });
    return promise;
  }

  /**
   * @description - Writing Logs to file
   * @param {String} filepath - File path to store log file and write
   * @param {String} message - Message to add in log
   * @returns {Object}
   */
  async logWriter(filepath, message) {
    try {
      let currDate = dateTime.getCurrentDateTime("DDMMMYY", false, "");
      filepath = path.join(__dirname, "..", `${filepath.split(".").join("")}`);
      if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath, "0744");
      }
      filepath = path.join(`${filepath}${currDate}.log`);
      message = `\n${dateTime.getCurrentDateTime("HH:mm:ss", false, "")}: ${message}`;
      fs.appendFile(filepath, message, function (err) {
        if (err) console.log(err);
      });
      return { success: true, message: "Log Updated" };
    } catch (e) {
      console.log("!logWriter:", e);
      return { success: false, message: "Error Writing Log" };
    }
  }
}

module.exports = FileUtility;
