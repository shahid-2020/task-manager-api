const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const httpError = require('http-errors');
const auth = require('../middlewares/authMiddleware');
const User = require('../models/userModel');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/email');
const router = new express.Router();

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }

    cb(undefined, true);
  },
});

router.post('/', async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.send({ status: 'success', data: { user, token } });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ status: 'success', data: { user, token } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', auth.authorize, async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.post('/logoutAll', auth.authorize, async (req, res, next) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

// router.get('/', async (req, res, next) => {
//   try {
//     const users = await User.find({});
//     res.send({ status: 'success', data: users });
//   } catch (error) {
//     next(error);
//   }
// });

// router.get('/:id', async (req, res, next) => {
//   const _id = req.params.id;

//   try {
//     const user = await User.findById(_id);

//     if (!user) {
//       throw httpError.NotFound();
//     }

//     res.send({ status: 'success', data: user });
//   } catch (error) {
//     next(error);
//   }
// });

router.get('/me', auth.authorize, async (req, res, next) => {
  try {
    res.send({ status: 'success', data: req.user });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', auth.authorize, async (req, res, next) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      throw httpError.NotAcceptable('Invalid updates!');
    }

    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.send({ status: 'success', data: req.user });
  } catch (error) {
    next(error);
  }
});

router.delete('/me', auth.authorize, async (req, res, next) => {
  try {
    await req.user.remove();
    sendCancelationEmail(req.user.email, req.user.name);
    res.send({ status: 'success', data: req.user });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/me/avatar',
  auth.authorize,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      req.user.avatar = buffer;
      await req.user.save();
      res.send({ status: 'success' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/me/avatar', auth.authorize, async (req, res, next) => {
  try {
    req.user.avatar = undefined;
    await req.user.save();
    res.send({ status: 'success' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/avatar', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
