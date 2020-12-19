var express = require("express");
const { request } = require("express");
var app = express();
var bodyParser = require("body-parser");
const mongoose = require('mongoose');
var Comment = require('./models/comments');
//var seedDB= require('./seed.js');
var Post = require('./models/posts.js');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('./models/user.js');
var methodOverride = require('method-override');
var flash = require('connect-flash');
require('dotenv').config();

app.use(flash());
app.use(require('express-session')({
    secret: "Rusty is the best",
    resave: false,
    saveUninitialized: false,
}));


mongoose.connect('your link to connect to MongoDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to DB!'))
    .catch(error => console.log(error.message));

app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});
//===cloudinary=====================================================
var multer = require('multer');
var storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
const posts = require("./models/posts.js");
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});



//================================================//

app.get("/", function (req, res) {
    res.render("landing.ejs");

});

app.get("/home", isLoggedIn, function (req, res) {
    Post.find({}, function (err, allposts) {
        if (err) {
            console.log(err);
        }
        else {

            res.render('home.ejs', { posts: allposts });
        }
    }).sort({ createdOn: 'desc' });

});

app.get("/profile", isLoggedIn, function (req, res) {
    Post.find({}, function (err, allposts) {
        if (err) {
            console.log(err);
        }
        else {
            res.render("profile.ejs", { posts: allposts });
        }
    }).sort({ createdOn: 'desc' });

});
//================================== NewPost========================
app.get("/newpost", isLoggedIn, function (req, res) {
    res.render("newpost.ejs");
});
app.post("/:id/newpost", isLoggedIn, upload.single('image'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        req.body.image = result.secure_url;
        var newpost = new Post({
            image: req.body.image,
            caption: req.body.caption,
            likes: 0,
            authorid: req.params.id,
            petname: req.body.petname,
            iconimage: req.body.iconimage,
        });
        Post.create(newpost, function (err, newpost) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("hi");
                console.log(newpost);
                req.flash('success', 'Added your post successfully!');
                res.redirect('/home');
            }
        });

    });

});
//=========== Search =========

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

app.get("/search", isLoggedIn, function (req, res) {
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        User.find({ "petname": regex }, function (err, foundusers) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(foundusers);
                res.render('searchresult.ejs', { user: foundusers, currentUser: req.user });
            }
        });
    }

});

app.get("/friends", function (req, res) {
    res.render("friends.ejs");
});

//===================  NEwcomment ======================//

app.post("/post/:postid/newcomment/:userid", isLoggedIn, function (req, res) {
    Post.findById(req.params.postid, function (err, post) {
        if (err) {
            console.log(err);
        }
        else {
            var text = req.body.comment;
            var authorid = req.params.userid;
            var author = req.body.author;
            var comment = new Comment({ text: text, authorid: authorid, author: author });
            Comment.create(comment, function (err, newcomment) {
                if (err) {
                    console.log(err);
                }
                else {
                    post.comments.push(newcomment);
                    console.log(newcomment);
                    post.save();
                    res.redirect('/home#' + req.params.postid);
                }
            })
        }
    })
});

//===========================Like ================================//
app.put('/post/:postid/like', isLoggedIn, function (req, res) {
    Post.findById(req.params.postid, function (err, foundpost) {
        if (err) {
            console.log(err);
        }
        else {
            foundpost.likes = foundpost.likes + 1;
            foundpost.likedby.push(req.user._id);
            foundpost.save();
            console.log(foundpost);
            res.redirect('/home#' + req.params.postid);
        }
    });
});

//============================== addfriend =====================//

app.put("/currentuser/:cuid/:fid/friend", isLoggedIn, function (req, res) {
    User.findById(req.params.cuid, function (err, founduser) {
        if (err) {
            console.log(err);
        }
        else {
            User.findById((req.params.fid), function (err, fr) {
                if (err) {
                    console.log(err);
                }
                else {
                    founduser.friends.push(fr);
                    founduser.friendsid.push(req.params.fid);
                    founduser.save();
                    console.log(founduser);
                    res.redirect('back');
                }
            });
        }
    });
});

//================ View Profile ==================//

app.get("/petprofile/:id/view", isLoggedIn, function (req, res) {
    User.findById(req.params.id, function (err, fp) {
        if (err) {
            console.log(err);
        }
        else {
            Post.find({}, function (err1, posts) {
                if (err) {
                    console.log(err1);
                }
                else {
                    res.render('petprofile.ejs', { pet: fp, posts: posts });
                }
            })

        }
    });
});

//==================== About us ============//

app.get("/aboutus", function (req, res) {
    res.render("aboutus.ejs");
});

//=============== Privacy ==============//
app.get("/privacy", isLoggedIn, function (req, res) {
    res.render('privacy.ejs');
});
//=============================== AUTH ==================================//
app.get("/login", function (req, res) {
    res.render("login.ejs");
});

app.post("/login", passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: 'back',
}), function (req, res) {

});


app.get("/signup", function (req, res) {
    res.render("signup.ejs");
});

app.post("/signup", upload.single('image'), function (req, res) {
    cloudinary.uploader.upload(req.file.path, function (result) {
        req.body.image = result.secure_url;

        var user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            contact: req.body.contact,
            petname: req.body.petname,
            image: req.body.image,
            breed: req.body.breed,
            description: req.body.description,
        });
        User.register(user, req.body.password, function (err, newUser) {
            if (err) {
                console.log(err);
                req.flash("error", err.message);
                return res.redirect('/signup');
            }
            else {
                passport.authenticate('local')(req, res, function () {
                    console.log(newUser);
                    req.flash("success", 'Welcome to Purrfect , ' + newUser.petname);
                    res.redirect('/home');
                });
            }
        });
    });
});

app.get('/logout', function (req, res) {
    req.logout();
    req.flash('success', 'Logged out from your account.')
    res.redirect('/login');
});

//===================== MIDDLEWARE =================//
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    else {
        req.flash("error", 'You need to be logged in to do that.');
        res.redirect('/login');
    }
};


//====================================================//

app.get("*", function (req, res) {
    res.render("404.ejs");
});


app.listen(process.env.PORT || 3000, process.env.IP, function (req, res) {
    console.log("rollin");
});