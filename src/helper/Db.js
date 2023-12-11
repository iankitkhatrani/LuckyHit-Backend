const {ObjectId} = require('mongodb');

class DbUtility {

  toObjectId(idString) {
    return new ObjectId(idString);
  }

  /**
   * count will get count number of document in collection
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of fetch record
   * @return {Object} responseObject with status,message and data(no. of record count)
   */
  async count(model, condition = {}) {
    try {
      let data = await model.countDocuments(condition);
      return { status: 1, message: 'Data found', data };
    } catch (error) {
      return { status: 0, message: 'No data found' };
    }
  };

  /**
   * insert new record in collection
   * @param {Collection Object} model name of collection
   * @param {Object} newData object of new record
   * @return {Object} responseObject with status,message and data(new inserted record object)
   */
  async insert(Model, newData) {
    try {
      let document = new Model(newData);
      let data = await document.save();
      return { status: 1, message: 'Data inserted', data };
    } catch (error) {
      return { status: 0, message: 'No data inserted' };
    }
  };

  /**
   * insert Many records in collection
   * @param {Collection Object} model name of collection
   * @param {Array} newData array of new records objects
   * @return {Object} responseObject with status,message and data(new inserted records count)
   */
  async insertMany(Model, newData) {
    try {
      let data = await Model.insertMany(newData);
      return { status: 1, message: 'Data inserted', data };
    } catch (error) {
      return { status: 0, message: 'No data inserted' };
    }
  };

  /**
   * update existing record in collection
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of which record to be update
   * @param {Array} newData object of record to be replace with old record
   * @return {Object} responseObject with status,message and data(updated record object)
   */
  async update(model, condition, newData) {
    try {
      let data = await model.findOneAndUpdate(condition, newData, { new: true });
      return { status: 1, message: 'Data updated', data };
    } catch (error) {
      return { status: 0, message: 'No data updated' };
    }
  };

  /**
   * soft delete record in collection(set flag isDeleted: 1)
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of which record to be delete
   * @return {Object} responseObject with status,message and data(deleted record object)
   */
  async softDelete(model, condition) {
    try {
      let data = await model.findOneAndUpdate(condition, { isDeleted: 1 }, { new: true });
      return { status: 1, message: 'Data deleted', data };
    } catch (error) {
      return { status: 0, message: 'No data deleted' };
    }
  };


  /**
   * delete record in collection
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of which record to be delete
   * @return {Object} responseObject with status,message and data(deleted record object)
   */
  async delete(model, condition) {
    try {
      let data = await model.findOneAndDelete(condition);
      return { status: 1, message: 'Data deleted', data };
    } catch (error) {
      return { status: 0, message: 'No data deleted' };
    }
  };


  /**
   * find records in collection
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of which record to be find
   * @return {Object} responseObject with status,message and data(fetched records array)
   */
  async find(model, condition = {}) {
    try {
      let data = await model.find(condition).lean();
      return { status: 1, message: 'Data found', data };
    } catch (error) {
      return { status: 0, message: 'No data found' };
    }
  };


  /**
   * find one records in collection
   * @param {Collection Object} model name of collection
   * @param {Object} condition condition of which record to be find
   * @return {Object} responseObject with status,message and data(fetched single record)
   */
  async findOne(model, condition = {}) {
    try {
      let data = await model.findOne(condition).lean();
      return { status: 1, message: 'Data found', data };
    } catch (error) {
      return { status: 0, message: 'No data found' };
    }
  };

  /**
   * Log Author for Create/Update
   * @param {Object} document - Details for record to be updated
   * @return {Object} Updated Docuents with Log
   */
  async authorLog(document, user, isUpdate = false) {
    try {
      if (!isUpdate) {
        document.createdBy = user.id
      }
      document.modifiedBy = user.id
    } catch (error) {
      console.log('Error: Author Log')
    }
    return document
  };

}

module.exports = DbUtility;
