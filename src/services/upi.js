
"use strict";
// const bcrypt = require("bcrypt");
// const Wallet = require("../models/wallet");
// const Config = require("../models/configuration");
const UPI = require("../models/upi");
const UPITRANSACTION = require("../models/upiTransaction");

const CommonUtility = require("../helper/Common");
const DateUtility = require("../helper/DateTime");
const DbUtility = require("../helper/Db");
// const SocketController = require("../communication/SocketContoller");
const CrypticUtility = require("../helper/Cryptic");

const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("../../constant").STATUS;
const { PAYEENAME, PAYEEVPA, PREV_TRANSACTIONS_RECORDS_LENGTH, PAYMENT_EXPIRE_TIME } = require("../../config");
const Controller = require("../Base/Controller");
const QRCode = require("qrcode");
const { get, size, last } = require("lodash");
// const nanoid = require("nanoid");
const { customAlphabet } = require("nanoid");
const { default: mongoose } = require("mongoose");

const commonUtility = new CommonUtility();
const dateUtility = new DateUtility();
const crypticUtility = new CrypticUtility();
const dbUtility = new DbUtility();
// const socketController = new SocketController();

const VERIFICATION_STATUS = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
  InvalidUpi: "Invalid Upi Id",
  UnableToProceed: "Unable To Proceed",
};

const PAYMENT_STATUS = {
  Pending: "Pending",
  Approved: "Completed",
  Reversed: "Reversed",
  Processing: "Processing",
  Queued: "Queued",
  Rejected: "Rejected",
  Expired: "Expired",
};

const REJECTION_TYPE = {
  Other: "Other",
  InvalidUpi: "InvalidUpi",
};

const REJECTION_MESSAGE = {
  Other: "Other",
  InvalidUpi: "Invalid UPI",
};

const TRANSACTION_TYPE = {
  DEPOSIT: "DEPOSIT",
  WITHDRAW: "WITHDRAW",
};

class UpiService extends Controller {
  /**
   * @description 1. Verify Upi
   */
  async verifyUpi() {
    try {
      const { id, role } = this.req.user;

      if (role === "user") {
        const user = await UPI.findOne({ user: id }).lean().exec();
        if (!user) {
          const { upiId } = this.req.body;
          const upiPayload = new UPI({
            upiId,
            user: id,
          });
          const res = await upiPayload.save();

          this.res.json({ success: true, message: "User verifyUpi", data: crypticUtility.encryptString(res) });
        } else {
          this.res.json({ success: true, message: "Already Registered" });
        }
      } else {
        this.res.json({ success: true, message: "Admin verifyUpi" });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
    }
  }

  /**
   * @description 2. Update Upi
   */
  async updateUpi() {
    try {
      const { id, role } = this.req.user;

      if (role === "user") {
        const upiDetails = await UPI.findOne({ user: id }).lean().exec();

        if (upiDetails) {
          const { upiId } = this.req.body;

          const res = await UPI.findOneAndUpdate({ user: id }, { $set: { upiId: upiId, status: VERIFICATION_STATUS.Pending, isVerified: false } }, { new: true })
            .lean()
            .exec();

          this.res.json({ success: true, message: "Update UPI", data: crypticUtility.encryptString(res) });
        } else {
          this.res.json({ success: true, message: "Not Registered" });
        }
      } else {
        return this.res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Error while processing request",
        });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
    }
  }

  /***
   * @description 3. get Upi Verification Details by User
   */
  async getUpiInfo() {
    const { id } = this.req.user;
    try {
      const upi = await UPI.findOne({ user: id }).lean().exec();
      if (upi) {
        return this.res.json({ success: true, message: "Upi info", data: crypticUtility.encryptString(upi) });
      } else {
        return this.res.json({ success: true, message: "Upi info", data: crypticUtility.encryptString({}) });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
    }
  }

  /***
   * @description 4. Check whether user can request for new payment DEPOSIT / WITHDRAW
   */
  async canInitiatePayment() {
    let isTransactionPending = false;
    let showMoreTransactions = false;
    let prevTransactions = [];
    let transactionRecordId = "";

    const { id } = this.req.user;
    const txtType = this.req.params.type ? this.req.params.type : "";
    let result = {};

    try {
      const upiTransaction = await UPITRANSACTION.findOne({ user: id }).lean().exec();

      if (upiTransaction) {
        let { transactions = [], _id } = upiTransaction;
        transactionRecordId = _id;

        transactions = transactions.filter(({ type }) => type === txtType);

        const transactionsLength = size(transactions);

        if (transactionsLength > PREV_TRANSACTIONS_RECORDS_LENGTH) showMoreTransactions = true; //initially sending only PREV_TRANSACTIONS_RECORDS_LENGTH transactions

        if (transactionsLength) {
          let pendingTransaction = transactions.find((txn) => txn.status === PAYMENT_STATUS.Pending);

          if (TRANSACTION_TYPE.DEPOSIT === txtType) {
            if (pendingTransaction) {
              let isTransactionExpired = await this.checkTransactionExpired(get(pendingTransaction, "createdOn", ""));

              if (isTransactionExpired) {
                const updatedRecord = await UPITRANSACTION.findOneAndUpdate(
                  { _id: get(upiTransaction, "_id", "") },
                  { $set: { "transactions.$[elem].status": PAYMENT_STATUS.Expired } },
                  { arrayFilters: [{ "elem._id": get(pendingTransaction, "_id", "") }], new: true }
                )
                  .lean()
                  .exec();

                transactions = get(updatedRecord, "transactions", []);
                pendingTransaction.status = PAYMENT_STATUS.Expired;
              }
            }
          }

          // Taking last couple of transactions
          prevTransactions = transactions?.splice(
            transactions.length > PREV_TRANSACTIONS_RECORDS_LENGTH ? transactions.length - PREV_TRANSACTIONS_RECORDS_LENGTH : 0,
            PREV_TRANSACTIONS_RECORDS_LENGTH
          );

          prevTransactions?.reverse();

          if (get(pendingTransaction, "status", "") === PAYMENT_STATUS.Pending) {
            isTransactionPending = true;
          }
        }
      }

      result = crypticUtility.encryptString({ isTransactionPending, prevTransactions, showMoreTransactions, transactionRecordId });
      return this.res.json({ success: true, message: "Success", data: result });
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
    }
  }

  /**
   * @description 5. Payment Deposit request initiated by user
   * @returns   Qr Code and transaction details to make payment
   */
  async initiateDeposit() {
    try {
      const { amount } = this.req.body;
      const { id } = this.req.user;

      const txnId = this.generateTransactionId();

      const txnDetails = {
        payeeVPA: PAYEEVPA,
        payeeName: PAYEENAME,
        amount,
        // transactionRef: txnId,
        // transactionId: txnId,
        transactionNote: txnId,
        // merchantCode: 5732,
        currency: "INR",
      };

      const condition = { user: id };
      const upiDetails = await UPI.findOne(condition).lean().exec();

      const { qr } = await this.generateQr(txnDetails);
      const links = await this.generatePaymentLinks(txnDetails);

      const transactionPayload = {
        amount,
        upiId: upiDetails.upiId,
        type: TRANSACTION_TYPE.DEPOSIT,
        txnRef: txnId,
      };

      const updatedTransaction = await UPITRANSACTION.findOneAndUpdate(
        condition,
        {
          $set: {
            upi: upiDetails._id,
          },
          $push: { transactions: transactionPayload },
        },
        { upsert: true, new: true }
      )
        .lean()
        .exec();

      const transactionDetails = last(updatedTransaction.transactions);
      if (get(transactionDetails, "amount", -1) === +amount && get(transactionDetails, "status", "") === PAYMENT_STATUS.Pending) {
        delete updatedTransaction.transactions;

        updatedTransaction.transaction = transactionDetails;
        const data = crypticUtility.encryptString({ qr, links, ...updatedTransaction });

        this.res.json({ success: true, message: "Qr Generated", data });
      } else {
        return this.res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Error while payment initiate",
        });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while payment initiate",
      });
    }
  }

  /**
   * @description 6. Withdraw Payment request initiated by user
   */
  async initiateWithdraw() {
    try {
      const { amount } = this.req.body;
      const { id } = this.req.user;

      const condition = { user: id };

      const upiDetails = await UPI.findOne(condition).lean().exec();
      const config = await Config.findOne().lean().exec();
      const wallet = await Wallet.findOne(condition).lean().exec();
      const availableBlance = Math.floor(get(wallet, "balance", 0) / config.oneCurrencyEqualTo);

      //Checking if sufficient balance is in wallet or not
      if (availableBlance >= amount) {
        const transactionPayload = {
          amount,
          upiId: upiDetails.upiId,
          type: TRANSACTION_TYPE.WITHDRAW,
        };

        const updatedTransaction = await UPITRANSACTION.findOneAndUpdate(
          condition,
          {
            $set: {
              upi: upiDetails._id,
            },
            $push: { transactions: transactionPayload },
          },
          { upsert: true, new: true }
        )
          .lean()
          .exec();

        const transactionDetails = last(updatedTransaction.transactions);
        if (get(transactionDetails, "amount", -1) === +amount && get(transactionDetails, "status", "") === PAYMENT_STATUS.Pending) {
          delete updatedTransaction.transactions;
          updatedTransaction.transaction = transactionDetails;
          return this.res.json({ success: true, message: "Success", data: crypticUtility.encryptString({ ...updatedTransaction }) });
        } else {
          return this.res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Error while payment initiate",
          });
        }
      } else {
        return this.res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }
    } catch (error) {
      console.log("error => ", error);
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while payment initiate",
      });
    }
  }

  /***
   * @description generating qr code as per user's request
   */
  async generateQr({
    payeeVPA: pa,
    payeeName: pn,
    payeeMerchantCode: me,
    transactionId: tid,
    transactionRef: tr,
    transactionNote: tn,
    amount: am,
    minimumAmount: mam,
    currency: cu,
    transactionRefUrl: url,
    merchantCode: mc,
  }) {
    return new Promise((resolve, reject) => {
      let error = this.validateParams({ pa, pn });
      if (error) reject(new Error(error));

      let intent = "upi://pay?";
      // let intent = "gpay://pay?";
      if (pa) intent = this.buildUrl.call(intent, { pa, pn });
      if (am) intent = this.buildUrl.call(intent, { am });
      if (mam) intent = this.buildUrl.call(intent, { mam });
      if (cu) intent = this.buildUrl.call(intent, { cu });
      if (me) intent = this.buildUrl.call(intent, { me: "" });
      if (tid) intent = this.buildUrl.call(intent, { tid });
      if (tr) intent = this.buildUrl.call(intent, { tr }); // // tr: transactionRef upto 35 digits
      if (tn) intent = this.buildUrl.call(intent, { tn });
      if (mc) intent = this.buildUrl.call(intent, { mc });
      intent = intent.substring(0, intent.length - 1);

      QRCode.toDataURL(intent, { margin: 1 }, (err, qr) => {
        if (err) reject(new Error("Unable to generate UPI QR Code."));
        resolve({ qr, intent });
      });
    });
  }

  /**
   *
   * @description Generating Links for button (BHIM,PAYTM,PHONPE,GAY)
   * @returns Links object
   */
  async generatePaymentLinks({ payeeVPA, payeeName, payeeMerchantCode, transactionId, transactionRef, transactionNote, amount }) {
    let links = {};
    // links.BHIM = `upi://pay?pa=${payeeVPA}&pn=${payeeName}&am=${amount}&tn=${transactionId}&tr=${transactionRef}&cu=INR`; // >>>>>>>>> OK FOR BHIM <<<<<<<<<<<
    links.BHIM = `upi://pay?pa=${payeeVPA}&pn=${payeeName}&am=${amount}&tn=${transactionId}&cu=INR`; // >>>>>>>>> OK FOR BHIM <<<<<<<<<<<
    links.PAYTM = `paytmmp://pay?pa=${payeeVPA}&pn=${payeeName}&am=${amount}&tn=${transactionId}&tr=${transactionRef}&cu=INR`; // >>>>>>>>>>>> OK FOR PAYTM but need to us BHIM upi
    links.PHONEPE = `phonepe://pay?pa=${payeeVPA}&pn=${payeeName}&am=${amount}&tn=${transactionId}&tr=${transactionRef}&cu=INR`; // >>>>>>>>>>>> OK FOR PHONEPE but need to us BHIM upi
    // links.GPAY = `gpay://upi/pay?pa=${payeeVPA}&pn=${payeeName}&am=${amount}&tn=${transactionId}&tr=${transactionRef}&cu=INR`; //

    // upi://pay?pa=superinfotech@rbl&pn=paytmqr2810050501011ez3mtkvtspy@paytm&mc=5411&tr=2862130816183357&tn=2862130816183357&am=1.00&cu=INR&refUrl=
    return links;
  }

  /**
   * @description 7. Transaction Info by transactionId
   * @returns   Transaction details
   */
  async transactionById() {
    let transactionDetails = {};
    let isTransactionExpired = false;
    const { transactionId, transactionRecordId } = this.req.body;

    try {
      const isValidIds = mongoose.isValidObjectId(transactionRecordId) && mongoose.isValidObjectId(transactionId);
      if (isValidIds) {
        const transaction = await UPITRANSACTION.find(
          {
            _id: dbUtility.toObjectId(transactionRecordId),
          },
          {
            transactions: {
              $elemMatch: {
                _id: dbUtility.toObjectId(transactionId),
              },
            },
          }
        )
          .lean()
          .exec();
        transactionDetails = transaction[0];

        let transactionInfo = get(transactionDetails, "transactions[0]", {});

        if (size(transactionInfo)) {
          switch (get(transactionInfo, "status", "")) {
            case PAYMENT_STATUS.Expired: {
              isTransactionExpired = true;
              const data = crypticUtility.encryptString({ isTransactionExpired });
              return this.res.json({ success: true, message: "Transaction Details", data });
            }

            case PAYMENT_STATUS.Pending: {
              const transactionTime = await dateUtility.timeDifference(get(transactionInfo, "createdOn", ""), new Date().toISOString(), "seconds");

              isTransactionExpired = transactionTime > PAYMENT_EXPIRE_TIME ? true : false;

              if (isTransactionExpired) {
                const updatedRecord = await UPITRANSACTION.findOneAndUpdate(
                  { _id: transactionRecordId },
                  { $set: { "transactions.$[elem].status": PAYMENT_STATUS.Expired } },

                  { arrayFilters: [{ "elem._id": transactionId }] }
                )
                  .lean()
                  .exec();

                const data = crypticUtility.encryptString({ isTransactionExpired });
                return this.res.json({ success: true, message: "Transaction Details", data });
              } else {
                const txnDetails = {
                  payeeVPA: PAYEEVPA,
                  payeeName: PAYEENAME,
                  amount: get(transactionInfo, "amount", 0),
                  // transactionRef: get(transactionInfo, "txnRef", ""),
                  // transactionId: get(transactionInfo, "txnRef", ""),
                  transactionNote: get(transactionInfo, "txnRef", ""),
                  // merchantCode: 5732,
                  currency: "INR",
                };

                const { qr, intent } = await this.generateQr(txnDetails);
                const links = (await this.generatePaymentLinks(txnDetails)) || {};
                links.GPAY = intent;
                delete transactionDetails.transaction;
                transactionInfo.remainingTime = PAYMENT_EXPIRE_TIME - transactionTime;
                transactionDetails.transaction = transactionInfo;

                const data = crypticUtility.encryptString({ isTransactionExpired, ...transactionDetails, qr, links });

                return this.res.json({ success: true, message: "Transaction Details", data });
              }
            }

            default:
              const data = crypticUtility.encryptString({ isTransactionExpired });
              return this.res.json({ success: true, message: "Transaction Details", data });
          }
        } else {
          // Passing empty data when no transaction founds
          return this.res.json({ success: true, message: "Transaction Details", data: crypticUtility.encryptString({}) });
        }
      } else {
        return this.res.json({ success: true, message: "Transaction Details", data: crypticUtility.encryptString({}) });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while getting transaction details",
      });
    }
  }

  /**
   * @description 8. Transaction List by User
   * @returns   Transaction List
   */
  async transactionsList() {
    const { limit = 15, offset = 0, type } = this.req.body;
    const { id } = this.req.user;
    const query = [
      {
        $match: {
          user: dbUtility.toObjectId(id),
        },
      },
      {
        $unwind: {
          path: "$transactions",
        },
      },
      {
        $match: {
          "transactions.type": {
            $eq: type,
          },
        },
      },
      {
        $sort: {
          "transactions.createdOn": -1,
        },
      },
      { $skip: limit * offset },
      { $limit: limit },
    ];

    const countQuery = [
      {
        $match: {
          user: dbUtility.toObjectId(id),
        },
      },
      {
        $unwind: {
          path: "$transactions",
        },
      },
      {
        $match: {
          "transactions.type": {
            $eq: type,
          },
        },
      },

      {
        $count: "transactions",
      },
    ];

    try {
      const transactions = await UPITRANSACTION.aggregate(query).exec();

      const totalCount = await UPITRANSACTION.aggregate(countQuery).exec();
      const paginatedDetails = {
        totalCount: totalCount.length ? totalCount[0].transactions : 0,
        limit,
        currentPage: offset,
      };

      return this.res.json(commonUtility.prepareSuccessResponse("Transactions List", {}, { data: crypticUtility.encryptString({ transactions, paginatedDetails }) }));
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while getting transaction list",
      });
    }
  }

  /***
   * @description 9. ADMIN : UPI Verification Requests List
   */

  // TODO Add Pagintion
  async verificationReqList() {
    try {
      const status = this.req.params.type ? this.req.params.type : "";
      const { limit = 15, offset = 0 } = this.req.body;
      let query = { status };
      let upiverificationReqs = await UPI.find(query)
        .populate("user", "_id name email phone username isVerified status")
        .sort({ createdOn: -1 })
        .limit(limit)
        .skip(limit * offset)
        .lean()
        .exec();
      let reqsCount = await UPI.find(query).count();

      const paginatedDetails = {
        totalCount: reqsCount,
        limit,
        currentPage: offset,
        // sortOrder,
        // sortBy,
      };

      return this.res.json(commonUtility.prepareSuccessResponse("Verification Requests", {}, { data: crypticUtility.encryptString({ upiverificationReqs, paginatedDetails }) }));
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while getting verification requests",
      });
    }
  }

  /***
   * @description 10. ADMIN : Fetch user's Deposit/Withdraw Requests List
   */

  async paymentRequests() {
    const { type, limit = 15, offset = 0 } = this.req.body;
    const transactionType = this.req.params.type ? this.req.params.type : "";

    try {
      const query = [
        {
          $unwind: {
            path: "$transactions",
          },
        },
        {
          $sort: {
            "transactions.createdOn": -1,
          },
        },
        {
          $match: {
            $and: [
              {
                "transactions.status": {
                  $eq: type,
                },
              },
              {
                "transactions.type": {
                  $eq: transactionType,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
          },
        },
        {
          $lookup: {
            from: "upi",
            localField: "upi",
            foreignField: "_id",
            as: "upi",
          },
        },
        {
          $unwind: {
            path: "$upi",
          },
        },
        {
          $project: {
            _id: 1,
            createdOn: 1,
            modifiedOn: 1,
            transactions: 1,
            upi: 1,
            "user._id": 1,
            "user.name": 1,
            "user.email": 1,
            "user.phone": 1,
            "user.username": 1,
            "user.isBot": 1,
            "user.isVerified": 1,
            "user.createdOn": 1,
            "user.isDeleted": 1,
          },
        },

        { $skip: limit * offset },
        { $limit: limit },
      ];

      const transactionReqs = await UPITRANSACTION.aggregate(query).exec();

      const countQuery = [
        {
          $unwind: {
            path: "$transactions",
          },
        },
        {
          $match: {
            $and: [
              {
                "transactions.status": {
                  $eq: type,
                },
              },
              {
                "transactions.type": {
                  $eq: transactionType,
                },
              },
            ],
          },
        },
        {
          $count: "transactions",
        },
      ];

      const totalCount = await UPITRANSACTION.aggregate(countQuery).exec();
      const paginatedDetails = {
        totalCount: totalCount.length ? totalCount[0].transactions : 0,
        limit,
        currentPage: offset,
        // sortOrder,
        // sortBy,
      };

      // this.res.json({ success: true, message: "Verification Requests", data: transactionReqs, paginatedDetails });
      return this.res.json(commonUtility.prepareSuccessResponse("Transaction Requests", {}, { data: crypticUtility.encryptString({ transactionReqs, paginatedDetails }) }));
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while getting deposit requests",
      });
    }
  }

  /***
   * @description 11. ADMIN : Update User's Deposit request Status (Approve / Reject)
   */
  async updateDepositStatus() {
    try {
      const { action, transactionRecordId, transactionId, amount, userId } = this.req.body;
      let socketPayload = { user: userId, accepted: false };
      let isAlreadyApproved = false;
      const upiTransaction = await UPITRANSACTION.findOne({ user: userId }).lean().exec();
      const transactionIndex = get(upiTransaction, "transactions", []).findIndex(({ _id }) => _id.toString() === transactionId);
      if (transactionIndex >= 0) {
        let transaction = upiTransaction.transactions[transactionIndex];
        if (transaction.status === PAYMENT_STATUS.Approved) {
          isAlreadyApproved = true;
        }
      }

      const updatedRecord = await UPITRANSACTION.findOneAndUpdate(
        { _id: transactionRecordId },
        { $set: { "transactions.$[elem].status": action } },
        { arrayFilters: [{ "elem._id": transactionId }], new: true }
      )
        .lean()
        .exec();

      const config = await Config.findOne().lean().exec();

      if (action === PAYMENT_STATUS.Approved) {
        const updatedWallet = await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: amount * config.oneCurrencyEqualTo },
          },
          { upsert: true, new: true }
        )
          .lean()
          .exec();

        socketPayload.walletInfo = updatedWallet;
        socketPayload.accepted = true;
      } else {
        let wallet;
        if (isAlreadyApproved) {
          const updatedWallet = await Wallet.findOneAndUpdate(
            { user: userId },
            {
              $inc: { balance: -amount * config.oneCurrencyEqualTo },
            },
            { upsert: true, new: true }
          )
            .lean()
            .exec();

          wallet = updatedWallet;
        }

        wallet = await Wallet.findOne({ user: userId }).lean().exec();
        socketPayload.walletInfo = wallet;
      }

      const transaction = updatedRecord?.transactions?.find(({ _id }) => _id.toString() === transactionId);
      socketPayload.transaction = transaction;

      socketController.paymentProceed(socketPayload);
      return this.res.json({ success: true, message: "Update Status", data: crypticUtility.encryptString(transaction) });
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while updating deposit status",
      });
    }
  }

  /***
   * @description 12. ADMIN : Update User's Withdraw request Status (Approve / Reject)
   */
  async updateWithdrawStatus() {
    try {
      const { action, transactionRecordId, transactionId, amount, userId } = this.req.body;
      let socketPayload = { user: userId, accepted: false };
      let isAlreadyApproved = false;
      const upiTransaction = await UPITRANSACTION.findOne({ user: userId }).lean().exec();
      const transactionIndex = get(upiTransaction, "transactions", []).findIndex(({ _id }) => _id.toString() === transactionId);
      if (transactionIndex >= 0) {
        let transaction = upiTransaction.transactions[transactionIndex];
        if (transaction.status === PAYMENT_STATUS.Approved) {
          isAlreadyApproved = true;
        }
      }

      const updatedRecord = await UPITRANSACTION.findOneAndUpdate(
        { _id: transactionRecordId },
        { $set: { "transactions.$[elem].status": action } },
        { arrayFilters: [{ "elem._id": transactionId }], new: true }
      )
        .lean()
        .exec();

      const config = await Config.findOne().lean().exec();
      if (action === PAYMENT_STATUS.Approved) {
        const updatedWallet = await Wallet.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: -amount * config.oneCurrencyEqualTo },
          },
          { upsert: true, new: true }
        )
          .lean()
          .exec();
        socketPayload.walletInfo = updatedWallet;
        socketPayload.accepted = true;
      } else {
        let wallet;
        if (isAlreadyApproved) {
          const updatedWallet = await Wallet.findOneAndUpdate(
            { user: userId },
            {
              $inc: { balance: amount * config.oneCurrencyEqualTo },
            },
            { upsert: true, new: true }
          )
            .lean()
            .exec();

          wallet = updatedWallet;
        }
        wallet = await Wallet.findOne({ user: userId }).lean().exec();

        socketPayload.walletInfo = wallet;
      }

      const transaction = updatedRecord?.transactions?.find(({ _id }) => _id.toString() === transactionId);
      socketPayload.transaction = transaction;
      socketController.paymentProceed(socketPayload);

      return this.res.json({ success: true, message: "Update Status", data: crypticUtility.encryptString(transaction) });
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while updating withdraw status",
      });
    }
  }

  /***
   * @description 13. ADMIN : Update User's UPI verification request Status (Approve / Reject)
   */
  async updateUPIVerificationStatus() {
    const { type } = this.req.body;

    try {
      switch (type) {
        case VERIFICATION_STATUS.Approved: {
          const { verificationRequestId, userId } = this.req.body;

          const upi = await UPI.findOne({ _id: verificationRequestId }).lean().exec();

          if (!get(upi, "isVerified", false)) {
            if (upi?.user?.toString() === userId) {
              const updateUpi = await UPI.findOneAndUpdate({ _id: verificationRequestId }, { $set: { status: type, isVerified: true } }, { new: true })
                .lean()
                .exec();

              socketController.upiProceed(updateUpi);
              return this.res.json({ success: true, message: "Approved Successfully" });
            } else {
              return this.res.status(INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Upi verification failed.",
              });
            }
          } else {
            return this.res.status(INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Upi is already verified",
            });
          }
        }

        case VERIFICATION_STATUS.Rejected: {
          const { type, verificationRequestId, selectedReason, reasonMessage } = this.req.body;

          if (selectedReason === REJECTION_TYPE.Other) {
            if (size(reasonMessage) > 0) {
              const updateUpi = await UPI.findOneAndUpdate({ _id: verificationRequestId }, { $set: { status: type, rejectionReason: reasonMessage, isVerified: false } }, { new: true })
                .lean()
                .exec();

              socketController.upiProceed(updateUpi);
              return this.res.json({ success: true, message: "Rejected Successfully" });
            } else {
              return this.res.json({ success: false, message: "Reason can't be empty" });
            }
          } else {
            const updateUpi = await UPI.findOneAndUpdate(
              { _id: verificationRequestId },
              { $set: { status: type, rejectionReason: REJECTION_MESSAGE[selectedReason], isVerified: false } },
              { new: true }
            )
              .lean()
              .exec();
            socketController.upiProceed(updateUpi);
            return this.res.json({ success: true, message: "Rejected Successfully" });
          }
        }

        default:
          return this.res.json({ success: false, message: "Internal server error" });
      }
    } catch (error) {
      return this.res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
    }
  }

  validateParams({ pa, pn }) {
    let error = false;
    if (!pa || !pn) error = "Virtual Payee's Address/Payee's Name is compulsory";
    if (pa?.length < 5 || pn?.length < 4) error = "Virtual Payee's Address/Payee's Name is too short.";
    return error;
  }

  buildUrl(params) {
    let url = this,
      qs = "";
    for (let [key, value] of Object.entries(params)) qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    if (qs.length > 0) url = url + qs;
    return url;
  }

  async checkTransactionExpired(date) {
    if (date) {
      const transactionTime = await dateUtility.timeDifference(date, new Date().toISOString(), "seconds");
      let isTransactionExpired = transactionTime > PAYMENT_EXPIRE_TIME ? true : false;
      return isTransactionExpired;
    } else {
      return true;
    }
  }

  generateTransactionId() {
    const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890", 13);
    return nanoid();
  }
}

module.exports = UpiService;
