//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const findOrCreate = require('mongoose-findorcreate');
const { authenticate } = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// some configuration
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// set up passport
app.use(passport.initialize());
// manage our session using passport
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/memoryDB", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(User, done) {
    done(null, User);
});
  
passport.deserializeUser(function(User, done) {
    done(null, User);
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/memory"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile)
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/auth/google",
    passport.authenticate('google',{ scope: ["profile"] }),
    function(req, res) {
    // Successful authentication, redirect to secrets.
        res.redirect("/auth/google/memory");
});

app.get('/auth/google/memory', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets page.
    res.redirect('/');
  });

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", function (req, res) {
  // const email = req.body.email;
  // const passWord = req.body.Password;
  // // Input variable whether they are equal to username and password

  // User.findOne({ email: email }, function (err, foundUser) {
  //   if (!err) {
  //     if (foundUser) {
  //       if(foundUser.password===passWord){
  //         res.render("home");
  //       }
  //       else{
  //         console.log("wrong password");
  //       }
  //     }
  //   } else {
  //     console.log(err);
  //   }
  // });
  const user = new User({
    email: req.body.email,
    password: req.body.Password
  });
  req.login(user,function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/home");
        });
    }
})
});

// app.get('/logout', function(req, res) {
//   req.logout(function(err){
//       if (err){ 
//           console.log(err); 
//       }else{
//           res.redirect('/');
//       }
      
//   });
// });

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  // const newUser = new User({
  //   username: req.body.username,
  //   email: req.body.email,
  //   password: req.body.password,
  // });
  // newUser.save(function (err) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.render("home");
  //   }
  // });

  User.register({username:req.body.username}, req.body.password, function(err, user) {
    if (err){
        console.log(err);
        res.render("register");
    }else{
        passport.authenticate("local")(req,res,function(){
            console.log("register succesfull");
            res.redirect("/home");
        });
    }
})
});

app.get("/fixpass", function (req, res) {
  res.render("fixpass");
});
app.post("/fixpass", function (req, res) {
  const email = req.body.email;
  const newpassWord = req.body.newPassword;
  // Input variable whether they are equal to username and password

  User.updateOne({ email: email }, {password:newpassWord},function (err) {
    if (!err) {
      res.render("login")
    } else {
      console.log(err);
    }
  });
});

app.get("/albums", function (req, res) {
  res.render("albums");
});
app.get("/posts", function (req, res) {
  res.render("posts");
});

app.listen(3000, function () {
  console.log("3000!");
});
