const express = require("express");
const router = express.Router();


router.get("/", function(req, res, next) {
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

module.exports = router;