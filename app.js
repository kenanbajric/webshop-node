const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
// const bodyParser = require('body-parser');  
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const MONGODB_URI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.awjuf.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

//     `mongodb+srv://${process.env.MONGO_USER}johnny:1234@cluster0.awjuf.mongodb.net/shop?retryWrites=true&w=majority`
//Max je u kursu obrisao RetryWrites..

const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

//multer configuration
//gdje smjestiti file na disku
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

//fileFilter consiguration - filtriranje file-ova
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const User = require('./models/user');

app.set('view engine', 'ejs');
app.set('views', 'views');

const errorController = require('./controllers/error');

//routes
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
// const { collection } = require('./models/user'); //nisam siguran šta ova linija koda radi, mislim da se koristila za mongodb prije mongoose
// linija iznad je next gen javascript gdje radimo dekonstrukciju objekta - ovo trebam dublje istraziti

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(helmet()); //nakon iniciranja express app i nakon svih middleware - ovo dodaje headers za zastitu 
app.use(compression()); //compressing assets
app.use(morgan('combined', {stream: accessLogStream})); //logging request data 

app.use(express.urlencoded({extended: false})); //bodyParser je depraceted, i sada sa ovom linijom pozivamo body-parser module
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

//middleware ispod ne znam sta radi
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

//csurf iniciramo nakon sto smo inicirali session
app.use(csrfProtection);

//flash poruke iniciramo nakon sto smo inicirali session
app.use(flash());

//extact the user
app.use((req, res, next) => {
    if (!req.session.user){
        return next();
    } else {
        User.findById(req.session.user._id)
            .then(user =>{
                if (!user) {
                    return next();
                }
                req.user = user;
                next();
            })
            .catch(err => {
                next(new Error(err));
            });
    }
});

app.use((req, res, next) => {
    res.locals.isAuth = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(shopRoutes);
app.use('/admin', adminRoutes);
app.use(authRoutes);

app.get('/500', errorController.error500);

app.use(errorController.error404);

app.use((error, req, res, next) => {
    console.log(error);
    res.redirect('/500');
});

mongoose
    .connect(MONGODB_URI)
    .then(result => {   
        // https
        //     .createServer({key: privateKey, cert: certificate}, app)
        //     .listen(process.env.PORT || 3000);
            app.listen(process.env.PORT || 3000);

    })
    .catch(err => {
        console.log(err)
    });