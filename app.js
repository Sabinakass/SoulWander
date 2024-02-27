require("dotenv").config();
const express = require("express");
const session = require("express-session");
const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/user");
const Goal=require("./models/goal");
const JournalEntry=require("./models/journal");
const bcrypt = require('bcrypt');




const app = express();
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection established"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.static('./'));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");

app.use((req, res, next) => {
    if (req.session && req.session.user) {
      req.user = req.session.user;
    } else {
      req.user = null;
    }
    next();
  });

app.get('/', (req, res) => {
    if (req.user) {
        if (req.user.role === 'user') {
            res.render('welcome', { username: req.user.username, loggedInUser: req.user });
        } else if (req.user.role === 'admin') {
            res.render('admin');
        }
    } else {
        res.render('welcome_guest', { loggedInUser: req.user }); 
    }
});

  
  app.get('/login', (req, res) => {
    res.render('login');
});


app.post('/login', async (req, res) => {
    try {
      // Assuming authentication is successful and user information is available in req.body
      const userData = req.body; // User information obtained from login form
  
      // Example: Set the user's role to 'user'
      userData.role = 'user';
  
      // Update user's role in the database
      const user = await User.findOneAndUpdate({ email: userData.email }, { role: userData.role }, { new: true });
  
      if (!user) {
        // Handle case where user is not found
        return res.status(404).send('User not found');
      }
  
      // Store user information in session
      req.session.user = user;
  
      // Redirect to homepage or desired page
      res.redirect('/');
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).send('Server Error');
    }
  });

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Please provide username, email, and password.');
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User with this email already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword 
        });

        await newUser.save();

        res.redirect('/login');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user. Please try again later.');
    }
});

  app.post('/newGoal', async (req, res) => {
    const { description, category, daysToAccomplish } = req.body;
    const newGoal = new Goal({
        user: req.user._id, 
        description,
        category,
        daysToAccomplish,
        progress: 0
    });
    try {
        await newGoal.save();
        res.redirect('/goal'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.post('/updateProgress/:id', async (req, res) => {
    const goalId = req.params.id;
    try {
        const goal = await Goal.findById(goalId);
        if (!goal) {
            return res.status(404).send('Goal not found');
        }
        goal.progress += 1; 
        await goal.save();
        res.redirect('/goal');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});
  
app.get('/goal', async (req, res) => {
    try {
       
        const goals = await Goal.find({ user: req.user._id }); 

        res.render('goal', { goals: goals });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).send('Error loading goals page');
    }
});


  app.get('/newGoal', (req, res) => {
    res.render('newGoal');
});

app.get('/journal', async (req, res) => {
    try {
        const journalEntries = await JournalEntry.find({ user: req.user._id }).sort({ createdAt: -1 });
        
        res.render('journal', { loggedInUser: req.user ,journalEntries });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/new-entry', (req, res) => {
    const mood = req.query.mood;
    try {
        // Render your 'add new entry' page here, passing the mood to the template
        res.render('new-entry',{loggedInUser: req.user}); 
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while preparing to create a new entry');
    }
});

app.post('/new-entry', async (req, res) => {
   
    try {
        const newEntry = new JournalEntry({
            user: req.user._id, 
            title: req.body.title,
            content: req.body.content,
            mood:req.body.mood,
        });
        await newEntry.save();

        res.redirect('/journal');
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while creating a new entry');
    }
});




app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
