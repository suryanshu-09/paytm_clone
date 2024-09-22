const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware")
const { Account } = require("../db")
const mongoose = require("mongoose")

router.get("/balance", authMiddleware, async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.headers.userId);
  const account = await Account.findOne({
    userId
  });
  if (!account) {
    res.json({
      msg: "Oopsie daisie"
    })
  }
  res.json({
    balance: account.balance
  })
})

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount, to } = req.body;

  const userId = new mongoose.Types.ObjectId(req.headers.userId);
  const account = await Account.findOne({
    userId
  }).session(session);

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient balance"
    });
  }

  let toId = new mongoose.Types.ObjectId(req.body.to);
  const toAccount = await Account.findOne({
    userId: toId
  }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Invalid account"
    });
  }

  await Account.updateOne({
    userId
  }, {
    $inc: {
      balance: -amount
    }
  }).session(session);
  await Account.updateOne({
    userId: toId
  }, {
    $inc: {
      balance: amount
    }
  }).session(session);

  await session.commitTransaction();

  res.json({
    message: "Transfer successful"
  });
})
module.exports = router;
