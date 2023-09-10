//jshint esversion:6
// require("dotenv").config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const multer=require("multer")

const app = express();

// app.use(express.static("upload"))
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// var storage=multer.diskStorage({
//     destination:function(req,file,cb){
//         cb(null,"./upload");
//     },
// });
// var upload=multer({storage:storage});

app.use(session({
    secret: "our littlt secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDb");

const eventSchema=new mongoose.Schema({
    
    title: String,
    eventimage: String,
    eventdescription: String,
    link: String

})


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    secret: String,
    clubName: String,
    image: String,
    description: String,
    instagram: String,
    website: String,
    events: [eventSchema]
});



userSchema.plugin(passportLocalMongoose);

const Event=new mongoose.model("Event",eventSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/login", function (req, res) {
    res.render("login.ejs");
});

app.get("/clubs", function (req, res) {
    User.find({clubName:{$ne:null}}).then((foundUsers) => {
        res.render("clubs", {
            user:foundUsers
        });
    });
});

app.get("/register", function (req, res) {
    res.render("register.ejs");
});

app.get("/clubform", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("clubform");
    } else {
        res.redirect("/login");
    }
});

app.get("/", function (req, res) {
    User.find({$where: 'this.events.length > 0'}).then((foundUsers) => {
        
        res.render("secrets", {
            usersWithevents: foundUsers,
            user:foundUsers
        });
    });
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const event=new Event({
        title:req.body.title,
        eventimage:req.body.image,
        eventdescription:req.body.clubdescription,
        link:req.body.link
    })
   
    event.save();
    User.findById(req.user._id).then((founduser) => {
            founduser.events.push(event)
            founduser.save().then((onFulfilled) => {
            res.redirect("/");
        });

    });
});

app.get("/logout", function (req, res) {
    req.logOut(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});


app.post("/register", function (req, res) {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

app.post("/clubdetails", function (req, res) {
    User.findById(req.user._id).then((founduser) => {
        founduser.clubName = req.body.clubname,
            founduser.image = req.body.image,
            founduser.description = req.body.description,
            founduser.instagram = req.body.instagram,
            founduser.website = req.body.link,

            founduser.save().then((onFulfilled) => {
                res.redirect("/");
            });

    });
});


app.listen(3000, function () {
    console.log("server is listening on port 3000");
});