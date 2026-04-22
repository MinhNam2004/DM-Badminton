const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const Session = require("../models/Session");

const multer = require("multer");
const fs = require("fs");

/// ================= MULTER =================

// upload avatar
const storageMember = multer.diskStorage({
  destination: "public/uploads/members",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const uploadMember = multer({ storage: storageMember });

// upload video theo ngày
// upload media (ảnh + video)
const storageMedia = multer.diskStorage({
  destination: (req, file, cb) => {
    let date = new Date().toISOString().split("T")[0];
    let dir = `uploads/${date}`;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop(); // giữ đuôi file
    cb(null, Date.now() + "." + ext);
  }
});

const uploadMedia = multer({
  storage: storageMedia,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép ảnh hoặc video"));
    }
  }
});

router.delete("/video/delete", async (req, res) => {
  const { path, id } = req.body;

  try {
    if (fs.existsSync(path.substring(1))) {
      fs.unlinkSync(path.substring(1));
    }

    const session = await Session.findById(id);

    if (session && session.videos) {
      session.videos = session.videos.filter(v => v !== path);
      await session.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

router.delete("/session/delete-by-date", async (req, res) => {
  const { date } = req.body;

  try {
    // tìm tất cả session trong ngày đó
    const sessions = await Session.find({
      date: {
        $gte: new Date(date),
        $lt: new Date(date + "T23:59:59")
      }
    });

    for (let s of sessions) {
      if (s.videos && s.videos.length > 0) {
        s.videos.forEach(v => {
          const filePath = v.substring(1); // bỏ dấu /

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
    }

    // xoá luôn trong DB
    await Session.deleteMany({
      date: {
        $gte: new Date(date),
        $lt: new Date(date + "T23:59:59")
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});

/// ================= ROUTES =================

// HOME
router.get("/", (req, res) => {
  res.render("index");
});

// MEMBERS
router.get("/members", async (req, res) => {
  const members = await Member.find();
  res.render("members", { members });
});

router.post("/members/add", uploadMember.single("avatar"), async (req, res) => {
  await Member.create({
    name: req.body.name,
    avatar: "/uploads/members/" + req.file.filename
  });

  res.redirect("/members");
});

router.get("/members/delete/:id", async (req, res) => {
  await Member.findByIdAndDelete(req.params.id);
  res.redirect("/members");
});

// SESSION
router.get("/session/new", async (req, res) => {
  const members = await Member.find();
  res.render("session", { members });
});

router.post("/session/save", async (req, res) => {
  const { name, seo, water, court, shuttle, extra } = req.body;

  let players = [];
  let totalDay = 0;

  for (let i = 0; i < name.length; i++) {
    let total =
      (seo[i] * 5000) +
      (+water[i]) +
      (+court[i]) +
      (+shuttle[i]) +
      (+extra[i]);

    totalDay += total;

    players.push({
      name: name[i],
      seo: seo[i],
      water: water[i],
      court: court[i],
      shuttle: shuttle[i],
      extra: extra[i],
      total
    });
  }

  const newSession = await Session.create({ players, totalDay });

    res.redirect("/history/" + newSession._id);
});

// HISTORY
router.get("/history", async (req, res) => {
  const sessions = await Session.find().sort({ date: -1 });
  res.render("history", { sessions });
});

router.get("/history/:id", async (req, res) => {
  const session = await Session.findById(req.params.id);
  res.render("detail", { session });
});

// UPLOAD VIDEO
router.post("/upload", uploadMedia.single("media"), async (req, res) => {

  if (!req.file) {
    return res.json({ success: false, message: "Chưa chọn file" });
  }

  const filePath = "/" + req.file.path.replace(/\\/g, "/");

  const today = new Date().toISOString().split("T")[0];

  let session = await Session.findOne({
    date: {
      $gte: new Date(today),
      $lt: new Date(today + "T23:59:59")
    }
  });

  if (!session) {
    session = await Session.create({
      players: [],
      totalDay: 0,
      videos: []
    });
  }

  if (!session.videos) session.videos = [];

  session.videos.push(filePath);
  await session.save();

  res.json({ success: true });
}); 

router.get("/upload", async (req, res) => {
  const sessions = await Session.find().sort({ date: -1 });
  res.render("upload", { sessions });
});

module.exports = router;