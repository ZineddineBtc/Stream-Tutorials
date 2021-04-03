//jshint esversion:6
require("dotenv").config();
const fs = require("fs");
const busboy = require("connect-busboy");
const path = require("path");
const multer = require("multer");
const express = require("express");
const fileUpload = require("express-fileupload");
const session = require("express-session");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const Card = require("./models/card");
const { send } = require("process");
const { profile } = require("console");

mongoose.connect("mongodb+srv://adminzineddine:adminpassword@mycluster.sprtu.mongodb.net/myFirstDatabase", 
    {
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useFindAndModify: false, 
        useCreateIndex: true
    }
);


const app = express();
app.use(express.static("public"));
app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(busboy());
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


/////////////////////////// LOGIN - REGISTER ///////////////////////////

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
    res.redirect("/"+req.params.view);
    
});

/////////////////////////// Profile ///////////////////////////////

app.get("/profile", function(req, res){
    if(!req.isAuthenticated()){
        res.render("login", {view: "profile"});
    } else {
        if(req.user.imgData === null){
            res.render("profile", {
                view: "profile",
                isAuthenticated: true, 
                name: req.user.name,
                bio: req.user.bio,
                src: null
            });
        } else {
            let src = "data:image/"+req.user.imgContentType+
                      ";base64,"+ req.user.imgData.toString("base64");
            res.render("profile", {
                view: "profile",
                isAuthenticated: true, 
                name: req.user.name,
                bio: req.user.bio,
                src: src
            });
        }
    } 
});

app.post("/profile/update/:toUpdate/:name/:bio", function(req, res){
    if(req.isAuthenticated()){
        let toUpdate = req.params.toUpdate;
        if(toUpdate === "update-name") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {name: req.params.name}}, function(error, doc){if(error){console.log(error);}});
            console.log("name updated");
        } else if(toUpdate === "update-bio") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {bio: req.params.bio}}, function(error, doc){if(error){console.log(error);}});
            console.log("bio updated");
        } else if(toUpdate === "update-name-bio") {
            User.findOneAndUpdate({_id: (req.user._id)}, {$set: {name: req.params.name, bio: req.params.bio}}, function(error, doc){if(error){console.log(error);}});
            console.log("name and bio updated");
        }
    }
});

app.post("/profile/upload-photo", function(req, res){
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
    }
    const uploadedFile = req.files.file;
    var uploadPath = __dirname +"/" + uploadedFile.name;
    uploadedFile.mv(uploadPath, function(error) {
        if (error) return res.status(500).send(error);
        let imgData = fs.readFileSync(uploadPath);
        let imgContentType = "image/png";
        User.findOneAndUpdate({_id: (req.user._id)}, {$set: {imgData: imgData, imgContentType: imgContentType}}, 
            function(error, doc){
                if(error) console.log(error);
                else {
                    fs.unlink(uploadPath, (error) => {
                        if (error) throw error;
                        console.log(uploadPath + " was deleted");
                    }); 
                    res.redirect("/profile");
                }
            }
        );
    });
});

app.post("/profile/delete-photo", function(req, res) {
    User.findOneAndUpdate(
        {_id: (req.user._id)}, 
        {$set: {imgData: null, imgContentType: null}}, 
        function(error, doc){
            if(error) return console.log(error);
            res.redirect("/profile");
        });
});

app.post("/profile/get-cards", function(req, res){
    Card.find({userID: req.user._id}, function (error, docs) {
        if (error) {
            console.log(error);
        } else {
            res.send(docs);
        }
    });
});

app.post("/profile/create-card", function(req, res){
    let newCard = new Card();
    newCard.userID = req.user._id;
    newCard.userName = req.user.name;
    newCard.title = req.body.title;
    newCard.description = req.body.description;
    newCard.datetime = req.body.datetime;
    newCard.url = req.body.url;
    newCard.save(function(error, createdCard){
        if(!error) {
            res.send({
                cardID: createdCard._id,
                cardUserID: createdCard.userID
            });
        } else {
            console.log(error);
        }
    });
});

app.post("/profile/delete-card/:id", function(req, res) {
    const id = req.params.id;
    Card.findOneAndRemove({_id: id}, function(error){
        if(error) console.log(error);
    }); 
});

///////////////////////////     Dashboard   ///////////////////////////
app.get("/dashboard", function(req, res) {
    if(!req.isAuthenticated()){
        res.render("login", {view: "profile"});
    } else {
        res.render("dashboard", {
            view: "dashboard",
            isAuthenticated: true, 
            name: req.user.name
        });
    }
})

app.post("/dashboard/search/:query", function(req, res){
    if(!req.isAuthenticated()) 
        return res.render("login", {view: "profile"});
    const query = req.params.query;
    const regex = new RegExp(query, 'i');
    Card.find({title: {$regex: regex}}, function (error, docs) {
        if (error) {
            console.log(error);
        } else {
            res.send(docs);
        }
    });
});

app.post("/dashboard/get-profile-photo/:profileID", function(req, res){
    User.find({_id: mongoose.Types.ObjectId(req.params.profileID)}, 
        function(error, users){
            if(users[0].imgContentType == null) {
                src = "/images/profile-placeholder.png";
            } else if(users[0].imgContentType == "") {
                src = "/images/profile-placeholder.png";
            } else {
                src = "data:image/"+users[0].imgContentType+
                      ";base64,"+ users[0].imgData.toString("base64");
            } 
            res.send(src);
        });
});

app.post("/dashboard/visit-profile/:profileID", function(req, res){
    if(!req.isAuthenticated()) 
        return res.render("login", {view: "dashboard"});
    const profileID = req.params.profileID;
    if(profileID == req.user._id) {
        res.redirect("/profile");
    } else {
        res.redirect("/visit-profile/"+profileID);
    }
});
///////////////////////////  visit-profile  ///////////////////////////
app.get("/visit-profile/:profileID", function(req, res){
    if(!req.isAuthenticated()) {
        res.render("login", {view: "dashboard"});
    } else {
        User.find({_id: mongoose.Types.ObjectId(req.params.profileID)}, 
        function(error, users){
            if(users[0].imgContentType == null) {
                src = "/images/profile-placeholder.png";
            } else if(users[0].imgContentType == "") {
                src = "/images/profile-placeholder.png";
            } else {
                src = "data:image/"+users[0].imgContentType+
                      ";base64,"+ users[0].imgData.toString("base64");
            } 
            res.render("visit-profile", {
                view: "visit-profile",
                isAuthenticated: true, 
                name: req.user.name,
                profileID: req.params.profileID,
                profileName: users[0].name,
                profileBio: users[0].bio,
                src: src
            });
        });
    }
});

app.post("/visit-profile/get-cards/:profileID", function(req, res){
    Card.find({userID: req.params.profileID}, function (error, docs) {
        if (error) {
            console.log(error);
        } else {
            res.send(docs);
        }
    });
});

/////////////////////////// Feedback - sent ///////////////////////////
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

