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
const nodemailer = require("nodemailer");
const User = require("./models/user");

mongoose.connect("mongodb://localhost:27017/MyDatabase",//"mongodb+srv://admin-zineddine:adminpassword@mycluster.sprtu.mongodb.net/myDatabase", 
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
module.exports = passport;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "zineddine.bettouche.dev@gmail.com",
      pass: process.env.EMAIL_PASSWORD
    }
}); 

//////////////////////////////    Routes    ///////////////////////////////

app.get("/", function(req, res){
    res.redirect("/index");
});

app.get("/index", function(req, res){
    if(!req.isAuthenticated()){
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
    } 
});


////// LOGIN - REGISTER //////

app.get("/login/:view", function(req, res){
    res.render("login", {view: req.params.view}); 
});

app.post("/login/:view", function(req, res, next) {
    passport.authenticate("local", function(error, user, info) {
        if (error) return next(error); 
        if (!user) return res.redirect("/login/"+req.params.view); 
        req.logIn(user, function(error) {
            if (error) return next(error); 
            return res.redirect("/"+req.params.view);
        });
    })(req, res, next);
});

app.get("/register/:view", function(req, res){
    res.render("register", {view: req.params.view}); 
});

app.post("/register/:view", function(req, res){
    User.register(
        new User({
            username: req.body.username, 
            name:req.body.name, 
            points: 0
        }), 
        req.body.password, function(error, user){
        if(error){
            console.log(error);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/"+req.params.view);
        });
    });
});

app.get("/auth/google", passport.authenticate("google", {
    scope: ['https://www.googleapis.com/auth/userinfo.profile',
             'https://www.googleapis.com/auth/userinfo.email']
}));

app.get("/auth/google/index",
    passport.authenticate( "google", {
        successRedirect: "/",
        failureRedirect: "/login"
})); 

app.get("/logout/:view", function(req, res){
    req.logout();
    if(req.params.view === "profile"){
        res.redirect("/");
    } else {
        res.redirect("/"+req.params.view);
    }
});

////// Profile //////

app.get("/profile", function(req, res){
    if(!req.isAuthenticated()){
        res.render("login", {view: "profile"});
    } else {
        res.render("profile", {
            view: "profile",
            isAuthenticated: true, 
            name: req.user.name,
            bio: req.user.bio
        });
    } 
});
app.post("/profile/update/:bio", function(req, res){
    if(req.isAuthenticated()){
        User.findOneAndUpdate({_id: (req.user._id)}, 
            {$set: {bio: req.params.bio}}, 
            function(error, doc){
                if(error){
                    console.log(error);
                }   
            }
        );
    }
});

////// Feedback - sent //////

app.get("/feedback", function(req, res){
    if(!req.isAuthenticated()){
        res.render("feedback", {
            view: "feedback",
            isAuthenticated: false, 
            name: null
        }); 
    } else {
        res.render("feedback", {
            view: "feedback",
            isAuthenticated: true, 
            name: req.user.name
        }); 
    }
    
}); 

app.post("/feedback", function(req, res){
    let mailBody = "PROJECT: Stream Tutorials \n-------------------\n";
    if(req.isAuthenticated()) {
        mailBody += "Username: "+ req.user.username + "\n" +
                   "Name: "+ req.user.name + "\n";
    } else {
        mailBody += "No Username, no name \n";
    }
    mailBody += req.body.feedbackDescription;
    const mailOptions = {
        from: "zineddine.bettouche.dev@gmail.com",
        to: "zineddine.bettouche.dev@gmail.com",
        subject: req.body.feedbackTitle,
        text: mailBody
    };  
    transporter.sendMail(mailOptions, function(error, info){
        if (error){
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);  
            res.redirect("/feedback-sent");
        }
    });
});

app.get("/feedback-sent", function(req, res){
    if(!req.isAuthenticated()){
        res.render("feedback-sent", {
            view: "feedback-sent",
            isAuthenticated: false, 
            name: null
        }); 
    } else {
        res.render("feedback-sent", {
            view: "feedback-sent",
            isAuthenticated: true, 
            name: req.user.name
        }); 
    }
    
}); 



app.listen(process.env.PORT || 3000, function(){
    console.log("Server running on port 3000");
});

