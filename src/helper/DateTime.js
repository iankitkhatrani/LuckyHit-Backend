/**************************************
 * File: DateTime.js
 * Purpose: Date Time Utilities
 **************************************/

/* Imports */
const Moment = require("moment-timezone");

class DateTime {
  /**
   * 1. Return Current DateTime
   * @param {string} format - Format to return.
   * @param {boolean} isUTC - If need UTC time or Server's local time.
   * @param {string} timeZone - Convert Date Time as per Time zone provided.
   */
  getCurrentDateTime(format, timeZone = "", isUTC = false) {
    if (!format) format = "";
    let resultDate = isUTC ? Moment().utc().format(format) : Moment().format(format);
    if (timeZone != "") resultDate = transformDateToTimezone(resultDate, timeZone, format);
    return resultDate;
  }

  /**
   * 2. Return DateTime after addition or subtraction
   * @param {string} dateTime - DateTime/Date/Time.
   * @param {string} format - Format to return.
   * @param {string} operation - add/subtract.
   * @param {string} operateOn - year/month/day/hour/min.
   * @param {number} value - Value to increament/decreament.
   */
  async operateDateTime(dateTime, format, operation, operateOn, value, isUTC) {
    if (operation == "add") return new Date(Moment(dateTime).add(value, operateOn).format(format));
    else {
      return isUTC ? new Date(Moment(dateTime).subtract(value, operateOn).utc().format(format)) : new Date(Moment(dateTime).subtract(value, operateOn).format(format));
    }
  }

  /**
   * 3. Return Value after converting to Specified Format
   * @param {string} dateTime - DateTime/Date/Time.
   * @param {string} toFormat - Format to return.
   * @param {string} fromFormat - Transformation from format.
   * @param {boolean} isUTC - TO Consider UTC TimeZone.
   */
  async transformDate(dateTime, toFormat, fromFormat, isUTC) {
    if (!toFormat) toFormat = "DD-MM-YYYY";
    if (!dateTime || dateTime == "") dateTime = await this.getCurrentDateTime("", false, "");
    if (isUTC) return Moment(dateTime, fromFormat).utc().format(toFormat);
    else return Moment(dateTime, fromFormat).format(toFormat);
  }

  /**
   * 4. Returns If Date is Valid or Invalid
   * @param {string} dateTime - DateTime/Date/Time.
   */
  async isStandardDateTime(dateTime) {
    return Moment(dateTime).isValid();
  }

  /**
   * 5. Returns Datetime to Milliseconds
   * @param {string} dateTime - DateTime/Date/Time.
   */
  async toMilliseconds(dateTime) {
    return Moment(dateTime).format("x");
  }

  /**
   * 6. Returns Provided Seconds to Specified Format
   * @param {string} seconds - Seconds.
   * @param {string} format - Format to return.
   */
  async transformSeconds(seconds, format) {
    let duration = Moment.duration(seconds, "seconds");
    return Moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
  }

  /**
   * 7. Return Difference between Datetimes provided in specified format
   * @param {string} startDateTime - DateTime/Date/Time. - Should be Smaller
   * @param {string} endDateTime - DateTime/Date/Time. - Should be Larger
   * @param {string} differenceType - years/months/weeks/days/hours/minutes/seconds.
   * @param {string} providedFormat - Format of startDateTime & endDateTime.
   * @returns {number}
   */
  async timeDifference(startDateTime, endDateTime, differenceType, providedFormat) {
    if (!differenceType) {
      differenceType = "days";
    }
    return Moment(endDateTime, providedFormat).diff(Moment(startDateTime, providedFormat), differenceType);
  }

  /**
   * 8. Get Time Range
   * @param {string} rangeType - MONTH/WEEK/DAYS
   * @param {number} count - current = 0, previous = -1, next = 1
   * @param {string} returnFormat - Format of range to be returned
   * @returns {string}
   */
  async getRange(rangeType, count, returnFormat) {
    let startDateTime = await this.getCurrentDateTime("", false, "");
    let endDateTime = await this.getCurrentDateTime("", false, "");
    if (rangeType == "MONTH") {
      startDateTime = await this.operateDateTime(startDateTime, "", "add", "month", count, false);
      startDateTime = Moment(startDateTime, "").startOf("month");
      endDateTime = Moment(startDateTime, "").endOf("month");
    } else if (rangeType == "WEEK") {
      startDateTime = await this.operateDateTime(startDateTime, "", "add", "week", count, false);
      startDateTime = Moment(startDateTime, "").startOf("week");
      endDateTime = Moment(startDateTime, "").endOf("week");
    } else if (rangeType == "DAY") {
      startDateTime = await this.operateDateTime(startDateTime, "", "add", "day", count, false);
      startDateTime = Moment(startDateTime, "").startOf("day");
      endDateTime = Moment(startDateTime, "").endOf("day");
    }
    return { start: startDateTime, end: endDateTime };
  }

  /**
   * 9. Returns Day of the Week in Number
   * 0= Sunday, ..., 6= Saturday
   * @param {string} date - Date.
   * @returns {number}
   */
  async getWeekDay(date) {
    return Moment(date).day();
  }
}

module.exports = DateTime;
