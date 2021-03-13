//jshint esversion:6
require("dotenv").config();
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const nodemailer = require("nodemailer");

mongoose.connect("mongodb+srv://admin-zineddine:adminpassword@u-read-bolt-users.s5w0z.mongodb.net/MyDatabase", 
                {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true); 

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialize: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/google/index",
    passReqToCallback: true,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function(request, accessToken, refreshToken, profile, done) {
        User.findOrCreate({
            username: profile.emails[0].value, 
            googleId: profile.id,
            name: profile.displayName
        }, function (err, user) {return done(err, user);});
  }
));

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "zineddine.bettouche.dev@gmail.com",
      pass: process.env.EMAIL_PASSWORD
    }
}); 

app.get("/", function(req, res){
    res.redirect("/index");
});

app.get("/index", function(req, res){
    res.render("index");
    /* if(!req.isAuthenticated()){
        res.render("index", {
            view: "index",
            isAuthenticated: false, 
            name: null
        }); 
    } else {
        res.render("index", {
            view: "index",
            isAuthenticated: true, 
            name: req.user.name
        });
    }  */
});

app.listen(process.env.PORT || 3000, function(){
    console.log("Server running on port 3000");
});