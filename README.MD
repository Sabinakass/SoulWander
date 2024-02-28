# SoulWander

SoulWander is a web application designed to help users explore their emotions, set goals, and keep track of their personal development journey. It provides features such as journaling, goal setting, and mood tracking to support users in their self-discovery and growth.

## Features

- **User Authentication**: Users can sign up and log in to their accounts securely.
- **Journaling**: Users can create journal entries to reflect on their thoughts, feelings, and experiences.
- **Mood Tracking**: Users can track their mood by selecting from a range of emotions and optionally journal about it.
- **Goal Setting**: Users can set personal goals and track their progress over time.
- **Multilingual Support**: The application supports multiple languages, including English and Russian, to cater to a diverse user base.

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database for storing user data.
- **Mongoose**: MongoDB object modeling tool for Node.js.
- **EJS**: Templating engine for generating HTML markup.
- **Bootstrap**: Frontend framework for responsive design.
- **i18n**: Internationalization library for handling multilingual content.
- **bcrypt**: Library for hashing passwords securely.
- **axios**: HTTP client for making requests to external APIs.
- **dotenv**: Library for loading environment variables from a .env file.

## API Used

- BoredAPI for getting activity recommendation
- Unsplash for getting images on certain topic
-  AffirmationAPI for good affirmations

## Installation

1. Clone the repository
git clone https://github.com/your-username/SoulWander.git
2. Navigate to the project directory:
cd SoulWander
3. Install dependencies:
npm install
4. Set up environment variables:
   - Create a `.env` file in the project root.
   - Define the following environment variables in the `.env` file:
     ```
     MONGODB_URI=<your-mongodb-uri>
     SESSION_SECRET=<session-secret>
     ACCESS_KEY=<your-unsplash-access-key>
     ```

5. Start the application:

npm start

or 
 
by accesong heroku link

https://soul-wander-a1dc0ba482d4.herokuapp.com
