require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const User = require("./models/user");
const Goal=require("./models/goal");
const JournalEntry=require("./models/journal");
const bcrypt = require('bcrypt');
const axios = require('axios');
const translate = require('translate-google');
const Item = require('./models/item');



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

  app.use((req, res, next) => {
    if (req.query.lang) {
        req.session.userLanguage = req.query.lang;
    }

    req.session.userLanguage = req.session.userLanguage || 'ru';

    res.locals.userLanguage = req.session.userLanguage; // Make userLanguage available in all templates
    next();
});





const i18n = require('i18n');

i18n.configure({
    locales: ['en', 'ru'],
    directory: __dirname + '/locales',
    defaultLocale: 'en',
    cookie: 'lang',
    queryParameter: 'lang',
    autoReload: true,
    updateFiles: true,
    syncFiles: true,
});

app.use(i18n.init);


app.get('/', (req, res) => {
    if (req.user) {
        if (req.user.role === 'user') {
            res.render('welcome', {
                username: req.user.username,
                loggedInUser: req.user,
              
            });
        } 
    } else {
        res.render('welcome_guest', {
            loggedInUser: req.user,
            welcomeMessage: res.__('welcome_guest_message') // Use the translation for 'welcome_guest_message' key
        }); 
    }
});

  
  app.get('/login', (req, res) => {
    res.render('login');
});



  app.post('/login', async (req, res) => {
    try {
        const { email } = req.body; 

        const user = await User.findOne({ email: email });

        if (user) {
            if (user.role === 'admin') {
                req.session.user = user;
                req.session.role = 'admin'; 

                res.redirect('/admin');
            } else {
                req.session.user = user;
                req.session.role = 'user'; 

                res.redirect('/');
            }
        } else {
            res.status(401).send('Login Failed: User not found or password incorrect');
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).send('Internal Server Error');
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

        res.render('goal', { goals: goals,  loggedInUser:req.user });
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
    const feeling = req.query.feeling; 
    res.render('new-entry', {loggedInUser: req.user, feeling: feeling });
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

app.get('/profile',(req, res) => {
   
    res.render('my_profile', {loggedInUser: req.user,user: req.user});
});

app.post('/update-profile', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        const { username, email, password } = req.body;

        user.username = username;
        user.email = email;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        await user.save();

        res.redirect('/my_profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Server Error');
    }
});

app.post('/delete-profile', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        await User.findByIdAndDelete(user._id);

        req.session.destroy();

        res.redirect('/');
    } catch (error) {
        console.error('Error deleting profile:', error);
        res.status(500).send('Server Error');
    }
});

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
       
        next();
    } else {
        
        res.status(403).send('Access forbidden');
    }
};

app.get('/admin', isAdmin,async (req, res) => {
    try {
        const items = await Item.find({});
        const userLanguage = req.session.userLanguage || 'en';
        res.render("admin_dash", {
          items: items,
          userLanguage:userLanguage 
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Error loading admin page");
      }

});


app.get('/admin/addItem', async (req, res) => {
    res.render('addItemForm')
})


app.post('/addItem', async (req, res) => {
    const { imageCategory, affirmationType } = req.body;

    const unsplashResponse = await axios.get(`https://api.unsplash.com/photos/random?count=3&query=${imageCategory}`, {
        headers: {
            Authorization: 'Client-ID proccess.env.ACCESS_KEY'
        }
    
    });
    const imageUrls = unsplashResponse.data.map(image => image.urls.regular);

    try {
        let content;
        let translatedType;

        if (affirmationType === 'affirmation') {
            content = 'Affirmation'; 
            translatedType = await translate('Affirmation', { to: 'ru' }); 
        } else if (affirmationType === 'bored') {
            content = 'Activity Recommendations'; 
            translatedType = await translate('Activity Recommendations', { to: 'ru' });
        } else {
            throw new Error('Invalid affirmation type');
        }
let description;

if (affirmationType === 'affirmation') {
    const response = await axios.get('https://www.affirmations.dev/');
    description = response.data.affirmation;
} else if (affirmationType === 'bored') {
    const response = await axios.get('https://www.boredapi.com/api/activity?participants=1');
    description = response.data.activity;
} else {
    throw new Error('Invalid affirmation type');
}
const translatedDescRu = await translate(description, { to: 'ru' });
        const newItem = new Item({
            pictureUrls:imageUrls,
            names: [
                { language: 'en', name: content },
                { language: 'ru', name: translatedType }
            ],
            descriptions: [
                { language: 'en', description: description },
                { language: 'ru', description: translatedDescRu }
            ],
            timestamps: {
                created: new Date(),
                updated: null,
                deleted: null
            }
        });
        await newItem.save();

       
        //res.status(201).json({ message: 'Item added successfully', newItem });
        res.redirect('/admin')
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

app.get('/admin/editItem/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
      
        const item = await Item.findById(itemId);
        if (!item) {
           
            return res.status(404).send('Item not found');
        }
        
        res.render('editItemForm', { item: item });
    } catch (error) {
        console.error('Error fetching item for editing:', error);
      
        res.status(500).send('Internal Server Error');
    }
});


app.post('/admin/updateItem/:id', async (req, res) => {
   

    const { id } = req.params;
    const { affirmationType, descriptionEn, descriptionRu } = req.body;
  
    try {
      
      const updatedDescriptions = [
        { language: 'en', description: descriptionEn },
        { language: 'ru', description: descriptionRu }
      ];
  const updateAffirmationType=affirmationType;
  
      await Item.findByIdAndUpdate(id, {
        affirmationType:updateAffirmationType,
        descriptions: updatedDescriptions
      });
  
      res.redirect('/admin'); 
    } catch (error) {
      console.error('Error updating item:', error);
      res.status(500).send('Error updating the item');
    }
  });

  app.post('/admin/deleteItem/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const deletedItem = await Item.findByIdAndDelete(itemId);
        if (!deletedItem) {
            return res.status(404).send('Item not found');
        }
        res.redirect('/admin'); 
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Internal Server Error');
    }
});

  app.get('/advices', async (req, res) => {
    try {
        
        const items = await Item.find({}); 

        const userLanguage = req.session.userLanguage || 'en'; 

        res.render('advices', { items: items,userLanguage:userLanguage });
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Error loading the advices page');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Error logging out');
        } else {
            res.redirect('/');
        }
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
