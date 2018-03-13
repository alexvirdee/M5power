const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require("bcrypt");
const passport = require('passport');

const User = require('../models/user-model');

const authRoutes = express.Router();


authRoutes.post('/signup', (req, res, next) => {
	if(!req.body.signUpUsername || !req.body.signUpPassword){
        res.status(400).json({message: "Please provide both, username and password."});
        return;
    }
    User.findOne({ username: req.body.signUpUsername }, (err, userFromDb)=>{
        
        if(err){
            res.status(500).json({message: "Username check error"});
            return;
        }

        if(userFromDb){
            res.status(400).json({message: "That username is taken please choose another one"});
            return;
        }

        const salt = bcrypt.genSaltSync(10);
        const scrambledPassword = bcrypt.hashSync(req.body.signUpPassword, salt);
        
        const theUser = new User({
           username: req.body.signUpUsername,
           encryptedPassword: scrambledPassword 
        });
        theUser.save((err)=> {
            if(err){
                res.status(500).json({message: "Saving user error"});
                return;
            }
            // Automatically log in user after sign up
            req.login(theUser,(err) => {
                if(err){
                    res.status(500).json({message: "Login went bad."});
                    return;
                }
                // Clear the encryptedPassword before sending
                  // (not from the database, just from the object)
                theUser.encryptedPassword = undefined;

                // Send the user's information to the frontend
                res.status(200).json(theUser);
            });
        });
      }
    );
});


authRoutes.post('/login', (req, res, next) => {
    const authenticateFunction = passport.authenticate('local', (err, theUser, failureDetails) => {

        if(err){
            re.status(500).json({message: "Unknown error just happened while login."});
            return;
        }
        if (!theUser) {
          // "failureDetails" contains the error messages
          // from our logic in "LocalStrategy" { message: '...' }.
          res.status(401).json(failureDetails);
          return;
        }
        // Login successful, save them in the session.
        req.login(theUser, (err) => {
            if(err){
                res.status(500).json({message:"Session save went bad."});
                return;
            }

            // Clear the encryptedPassword before sending
            // (not from the database, just from the object)
            theUser.encryptedPassword = undefined;

            // Everything worked! Send the user's information to the client.
            res.status(200).json(theUser);
        });
    });
    authenticateFunction(req, res, next);
});


authRoutes.post("/logout", (req, res, next) => {
  // req.logout() defined by passport
  req.logout();
  res.status(200).json({ message: "Logged out successfully!" });
});


authRoutes.get("/checklogin", (req, res, next) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
    return;
  }

res.status(401).json({ message: "Unauthorized." });
});


module.exports = authRoutes;
