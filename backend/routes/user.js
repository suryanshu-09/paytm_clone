const express = require("express");
const zod = require("zod");
const jwt = require("jsonwebtoken")
const router = express.Router();
const { User, Account } = require("../db");
const { SECRET } = require("../.env");
const { authMiddleware } = require("../middleware");

const signup_user = zod.object({
  username: zod.string().email().max(50).min(3),
  password: zod.string().max(50).min(6),
  firstName: zod.string().max(50).min(3),
  lastName: zod.string().max(50).min(3),
})

router.post("/signup", async (req, res) => {
  const userPayLoad = req.body;
  const parsedPayLoad = signup_user.safeParse(userPayLoad);
  if (!parsedPayLoad.success) {
    res.status(411).json({
      msg: "You sent the wrong inputs."
    });
    return;
  }
  const existingUser = await User.findOne({
    username: req.body.username
  })
  if (existingUser) {
    res.status(411).json({
      msg: "Sorry, username already taken."
    })
  } else {
    const user = await User.create({
      username: userPayLoad.username,
      password: userPayLoad.password,
      lastName: userPayLoad.lastName,
      firstName: userPayLoad.firstName
    });
    const userId = user._id;

    await Account.create({
      userId,
      balance: 1 + Math.random() * 1000
    })

    res.status(200).json({
      msg: "User created successfully!",
      userId
    })
  }
})

const signin_user = zod.object({
  username: zod.string().email().max(50).min(3),
  password: zod.string().max(50).min(6),
})

router.post("/signin", async (req, res) => {
  const { success } = signin_user.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      msg: "You sent the wrong inputs."
    });
    return;
  }
  const existingUser = await User.findOne({
    username: req.body.username,
    password: req.body.password
  });
  if (existingUser) {
    const userId = existingUser._id;
    res.status(200).json({
      msg: "You've signed in.",
      token: jwt.sign({
        userId,
      }, SECRET)
    })
    return;
  }
  res.status(411).json({
    msg: "Database Error."
  })
})

router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [{
      firstName: {
        "$regex": filter
      }
    }, {
      lastName: {
        "$regex": filter
      }
    }]
  })
  res.json({
    user: users.map(user => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id
    }))
  })
})

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body)
  if (!success) {
    res.status(411).json({
      msg: "Error while updating information"
    })
  }
  await User.updateOne({ _id: req.UserId }, req.body);
  res.json({
    msg: "Updated successfully"
  })
})

module.exports = router;
