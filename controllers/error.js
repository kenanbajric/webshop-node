const path = require('path');

exports.error404 = (req, res, next) => {
    res.status(404).render('404', {
        pageTitle: 'Page not found',
        path: '/404',
    });
}

exports.error500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/404',
        isAuth: req.session.isLoggedIn
    });
}