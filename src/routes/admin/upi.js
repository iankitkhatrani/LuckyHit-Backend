const express = require('express');
const router = express.Router();

const UpiService = require("../../services/upi");

const UPI = require("../../models/upi");
const User = require("../../models/users");

const UPITRANSACTION = require("../../models/upiTransaction");
const CommonUtility = require("../../helper/Common");
const DateUtility = require("../../helper/DateTime");
const DbUtility = require("../../helper/Db");

const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = require("../../../constant").STATUS;
const { PAYEENAME, PAYEEVPA, PREV_TRANSACTIONS_RECORDS_LENGTH, PAYMENT_EXPIRE_TIME } = require("../../../config");
const Controller = require("../../Base/Controller");
const QRCode = require("qrcode");
const { get, size, last } = require("lodash");
// const nanoid = require("nanoid");
const { customAlphabet } = require("nanoid");
const { default: mongoose } = require("mongoose");

const commonUtility = new CommonUtility();
const dateUtility = new DateUtility();
const dbUtility = new DbUtility();

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


router.post("/verify-upi", async (req, res) => {
  console.log("Checkkkkkkk")
  try {
    console.log("check API");
    const { id, role } = req.body;

    if (role === "user") {
      const user = await UPI.findOne({ user: id }).lean().exec();
      if (!user) {
        const { upiId } = req.body;
        const upiPayload = new UPI({
          upiId,
          user: id,
        });
        const res = await upiPayload.save();

        res.json({ success: true, message: "User verifyUpi", data: res });
      } else {
        res.json({ success: true, message: "Already Registered" });
      }
    } else {
      res.json({ success: true, message: "Admin verifyUpi" });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
  }
});


router.post("/update-upi", async (req, res) => {
  try {
    const { id, role } = req.body;

    if (role === "user") {
      const upiDetails = await UPI.findOne({ user: id }).lean().exec();

      if (upiDetails) {
        const { upiId } = req.body;

        const res = await UPI.findOneAndUpdate({ user: id }, { $set: { upiId: upiId, status: VERIFICATION_STATUS.Pending, isVerified: false } }, { new: true })
          .lean()
          .exec();

        res.json({ success: true, message: "Update UPI", data: res });
      } else {
        res.json({ success: true, message: "Not Registered" });
      }
    } else {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while processing request",
      });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
  }
});

router.post("/initiate-deposit", async (req, res) => {
  try {
    const { amount, id } = req.body;

    const txnId = generateTransactionId();

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

    const { qr } = await generateQr(txnDetails);
    const links = await generatePaymentLinks(txnDetails);

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
      const data = { qr, links, ...updatedTransaction };

      res.json({ success: true, message: "Qr Generated", data });
    } else {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error while payment initiate",
      });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while payment initiate",
    });
  }
});

router.post("/initiate-withdraw", async (req, res) => {
  try {
    const { amount, id } = req.body;

    const condition = { user: id };

    const upiDetails = await UPI.findOne(condition).lean().exec();
    const wallet = await User.findOne(condition).lean().exec();
    const availableBlance = Math.floor(wallet.balance);

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
        return res.json({
          success: true, message: "Success", data: { ...updatedTransaction }
        });
      } else {
        return res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Error while payment initiate",
        });
      }
    } else {
      return res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }
  } catch (error) {
    console.log("error => ", error);
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while payment initiate",
    });
  }
});

router.post("/transaction", async (req, res) => {
  let transactionDetails = {};
  let isTransactionExpired = false;
  const { transactionId, transactionRecordId } = req.body;

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
            const data = { isTransactionExpired };
            return res.json({ success: true, message: "Transaction Details", data });
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

              const data = { isTransactionExpired };
              return res.json({ success: true, message: "Transaction Details", data });
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

              const { qr, intent } = await generateQr(txnDetails);
              const links = (await generatePaymentLinks(txnDetails)) || {};
              links.GPAY = intent;
              delete transactionDetails.transaction;
              transactionInfo.remainingTime = PAYMENT_EXPIRE_TIME - transactionTime;
              transactionDetails.transaction = transactionInfo;

              const data = { isTransactionExpired, ...transactionDetails, qr, links };

              return res.json({ success: true, message: "Transaction Details", data });
            }
          }

          default:
            const data = { isTransactionExpired };
            return res.json({ success: true, message: "Transaction Details", data });
        }
      } else {
        // Passing empty data when no transaction founds
        return res.json({ success: true, message: "Transaction Details", data: {} });
      }
    } else {
      return res.json({ success: true, message: "Transaction Details", data: {} });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while getting transaction details",
    });
  }
});

router.post("/transactions-list", async (req, res) => {
  const { limit = 15, offset = 0, type, id } = req.body;
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

    return res.json(commonUtility.prepareSuccessResponse("Transactions List", {}, { data: { transactions, paginatedDetails } }));
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while getting transaction list",
    });
  }
});

router.get("/upi-info", async (req, res) => {
  const { id } = req.user;
  try {
    const upi = await UPI.findOne({ user: id }).lean().exec();
    if (upi) {
      return res.json({ success: true, message: "Upi info", data: upi });
    } else {
      return res.json({ success: true, message: "Upi info", data: {} });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
  }
});

router.get("/can-initiate-payment/:type", async (req, res) => {
  let isTransactionPending = false;
  let showMoreTransactions = false;
  let prevTransactions = [];
  let transactionRecordId = "";

  const { id } = req.body;
  const txtType = req.params.type ? req.params.type : "";
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
            let isTransactionExpired = await checkTransactionExpired(get(pendingTransaction, "createdOn", ""));

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

    result = { isTransactionPending, prevTransactions, showMoreTransactions, transactionRecordId };
    return res.json({ success: true, message: "Success", data: result });
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
  }
});

router.post("/admin/verification-requests/:type", async (req, res) => {
  try {
    const status = req.params.type ? req.params.type : "";
    const { limit = 15, offset = 0 } = req.body;
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

    return res.json(commonUtility.prepareSuccessResponse("Verification Requests", {}, { data: { upiverificationReqs, paginatedDetails } }));
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while getting verification requests",
    });
  }
});

router.post("/admin/txn-requests/:type", async (req, res) => {
  const { type, limit = 15, offset = 0 } = req.body;
  const transactionType = req.params.type ? req.params.type : "";

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

    // res.json({ success: true, message: "Verification Requests", data: transactionReqs, paginatedDetails });
    return res.json(commonUtility.prepareSuccessResponse("Transaction Requests", {}, { data: { transactionReqs, paginatedDetails } }));
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while getting deposit requests",
    });
  }
});

router.put("/admin/deposit", async (req, res) => {
  try {
    const { action, transactionRecordId, transactionId, amount, userId } = req.body;
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


    if (action === PAYMENT_STATUS.Approved) {
      const updatedWallet = await User.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: amount },
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
        const updatedWallet = await User.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: -amount },
          },
          { upsert: true, new: true }
        )
          .lean()
          .exec();

        wallet = updatedWallet;
      }

      // wallet = await Wallet.findOne({ user: userId }).lean().exec();
      // socketPayload.walletInfo = wallet;
    }

    const transaction = updatedRecord?.transactions?.find(({ _id }) => _id.toString() === transactionId);
    socketPayload.transaction = transaction;

    // socketController.paymentProceed(socketPayload);
    return res.json({ success: true, message: "Update Status", data: transaction });
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while updating deposit status",
    });
  }
});

router.put("/admin/withdraw", async (req, res) => {
  try {
    const { action, transactionRecordId, transactionId, amount, userId } = req.body;
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

    if (action === PAYMENT_STATUS.Approved) {
      const updatedWallet = await User.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: -amount },
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
        const updatedWallet = await User.findOneAndUpdate(
          { user: userId },
          {
            $inc: { balance: amount },
          },
          { upsert: true, new: true }
        )
          .lean()
          .exec();

        wallet = updatedWallet;
      }
      // wallet = await Wallet.findOne({ user: userId }).lean().exec();

      // socketPayload.walletInfo = wallet;
    }

    const transaction = updatedRecord?.transactions?.find(({ _id }) => _id.toString() === transactionId);
    socketPayload.transaction = transaction;
    socketController.paymentProceed(socketPayload);

    return res.json({ success: true, message: "Update Status", data: transaction });
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while updating withdraw status",
    });
  }
});

router.put("/admin/update-upi-status", async (req, res) => {
  const { type } = req.body;

  try {
    switch (type) {
      case VERIFICATION_STATUS.Approved: {
        const { verificationRequestId, userId } = req.body;

        const upi = await UPI.findOne({ _id: verificationRequestId }).lean().exec();

        if (!get(upi, "isVerified", false)) {
          if (upi?.user?.toString() === userId) {
            const updateUpi = await UPI.findOneAndUpdate({ _id: verificationRequestId }, { $set: { status: type, isVerified: true } }, { new: true })
              .lean()
              .exec();

            return res.json({ success: true, message: "Approved Successfully" });
          } else {
            return res.status(INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Upi verification failed.",
            });
          }
        } else {
          return res.status(INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Upi is already verified",
          });
        }
      }

      case VERIFICATION_STATUS.Rejected: {
        const { type, verificationRequestId, selectedReason, reasonMessage } = req.body;

        if (selectedReason === REJECTION_TYPE.Other) {
          if (size(reasonMessage) > 0) {
            const updateUpi = await UPI.findOneAndUpdate({ _id: verificationRequestId }, { $set: { status: type, rejectionReason: reasonMessage, isVerified: false } }, { new: true })
              .lean()
              .exec();

            socketController.upiProceed(updateUpi);
            return res.json({ success: true, message: "Rejected Successfully" });
          } else {
            return res.json({ success: false, message: "Reason can't be empty" });
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
          return res.json({ success: true, message: "Rejected Successfully" });
        }
      }

      default:
        return res.json({ success: false, message: "Internal server error" });
    }
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(commonUtility.prepareErrorResponse(error));
  }
});

async function checkTransactionExpired(date) {
  if (date) {
    const transactionTime = await dateUtility.timeDifference(date, new Date().toISOString(), "seconds");
    let isTransactionExpired = transactionTime > PAYMENT_EXPIRE_TIME ? true : false;
    return isTransactionExpired;
  } else {
    return true;
  }
}

module.exports = router;
