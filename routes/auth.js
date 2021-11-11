const express = require('express');

const authController = require('../controllers/auth');

const { check, body } = require('express-validator/check');

const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {
                return User.findOne({ email: value.toLowerCase() }) //.toLowerCase() sam ja dodao jer je duplalo u bazi usere sa istim mailom
                    .then(userDoc => {
                        if (userDoc) {
                        return Promise.reject('This email already exist.');
                        }
                    });
            })
            .normalizeEmail(),
        body('password', 'Password can only have numbers and text, and must have at least 5 characters.')
            .isLength({min: 5})
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords have to match!')
                }
                return true;
            })
            .trim()
    ],
    authController.postSignup
);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter valid email adress.')
            .normalizeEmail(),
        body('password', 'Invalid password')
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ], 
    authController.postLogin);


router.post('/logout', authController.postLogout);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);


module.exports = router;