const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');

const router = express.Router();

const isAuth = require('../middleware/is-auth');

const { body } = require('express-validator/check');

// //home page route
router.get('/products', isAuth, adminController.getProducts);

// // /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// // /admin/add-product => POST
router.post('/add-product', [
    body('title')
        .isString()
        .isLength(3)
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 200 })
        .trim()
], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
        .isString()
        .isLength(3)
        .trim(),
    body('price')
        .isFloat(),
    body('description')
        .isLength({ min: 5, max: 200 })
        .trim()
], isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);


module.exports = router;
