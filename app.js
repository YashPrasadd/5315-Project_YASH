const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { body, validationResult, query, param } = require("express-validator");

const Restaurant = require("./models/restaurant");
const User = require("./models/user");
const bcrypt = require("bcrypt"); // Import bcrypt here

const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to MongoDB
mongoose
  .connect(process.env.DB_CONNECTION_STRING)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error(err));

// Set Handlebars as the view engine
app.set("view engine", "hbs");

// Static files
app.use(express.static("public"));

// Function to initialize database connection
const initializeDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Failed to connect to MongoDB Atlas:", error);
    process.exit(1);
  }
};

// Middleware for validating query parameters
const validateParams = [
  query("page").optional().isInt().toInt(),
  query("perPage").optional().isInt().toInt(),
  query("borough").optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Route for user login
app.post('/api/login', async (req, res) => {
  try {
    // const { em, password } = req.body;
    //Use your email id and password here
    const email = "garry";
    const password = "humber";
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });

    // Set session data
    req.session.userId = user._id;

    // Set cookie with JWT
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true // Set to true if using HTTPS
    });

    // res.json({ message: 'Login successful', token });
    res.redirect("/api/restaurants?token=${token}");
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to log in user' });
  }
});

// Middleware for route authorization
const authorizeUser = (req, res, next) => {
  try {
    // Get JWT from cookie
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify JWT
    const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

    // Set user ID in request object
    req.userId = decodedToken.userId;

    next();
  } catch (error) {
    // console.error('Error authorizing user:', error);
    res.send('Unauthorized');
  }
};

// JWT token generation middleware
// const generateToken = (user) => {
//   return jwt.sign(user, process.env.SECRET_KEY);
// };

// // Hard-coded user credentials for testing
// const users = [{ username: "testuser", password: "testpassword" }];
// app.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Find user by username
//     const user = await User.findOne({ username });

//     // If user not found, return error
//     if (!user) {
//       return res.status(400).json({ message: "Invalid username or password" });
//     }

//     // Compare hashed password with provided password
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(400).json({ message: "Invalid username or password" });
//     }

//     // If credentials match, generate JWT token
//     const token = jwt.sign({ username: user.username }, 'your-secret-key', { expiresIn: '1h' });

//     res.json({ token });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ error: "Failed to login" });
//   }
// });


// // Login route to generate JWT token
// app.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Find user by username
//     const user = await User.findOne({ username });

//     // If user not found, return error
//     if (!user) {
//       return res.status(400).json({ message: "Invalid username or password" });
//     }

//     // Compare hashed password with provided password
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(400).json({ message: "Invalid username or password" });
//     }

//     // If credentials match, generate JWT token
//     const token = generateToken({ username });

//     res.json({ token });
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ error: "Failed to login" });
//   }
// });

// // JWT middleware function to verify tokens
// const jwtMiddleware = (req, res, next) => {
//   const token = req.headers.authorization;

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ message: "Unauthorized" });
//     }
//     req.user = decoded;
//     // If the token is valid, continue to the next middleware
//     // Add a return statement here to explicitly return an "Authorized" response
//     return res.status(200).json({ message: "Authorized" }); // You can customize this message as needed
//   });
// };

// //Made some changes here by garry
// // Middleware for authorization
// const authorizeUser = (requiredPermission) => {
//   return (req, res, next) => {
//     // Check if user permissions include the required permission
//     const { permissions } = req.user; // Assuming permissions are included in the JWT payload
//     if (!permissions.includes(requiredPermission)) {
//       return res
//         .status(403)
//         .json({ message: "Forbidden: Insufficient permissions" });
//     }
//     next();
//   };
// };


// app.post('/api/register', async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Encrypt password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new user
//     const newUser = new User({ email, password: hashedPassword });
//     await newUser.save();

//     res.status(201).json({ message: 'User registered successfully' });
//   } catch (error) {
//     console.error('Error registering user:', error);
//     res.status(500).json({ error: 'Failed to register user' });
//   }
// });








// Apply authorization middleware to routes
app.post(
  "/api/restaurants",
  // jwtMiddleware,
  authorizeUser,
  [
    body("name").notEmpty(),
    body("borough").notEmpty(),
    body("cuisine").notEmpty(),
  ],
  async (req, res) => {
    try {
      console.log("Received POST request:", req.body);
      const newRestaurant = await Restaurant.create(req.body);
      console.log("New restaurant created:", newRestaurant);
      res.status(201).json(newRestaurant);
    } catch (err) {
      console.error("Error creating restaurant:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

app.put(
  "/api/restaurants/:id",
  
  authorizeUser,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedRestaurant = await Restaurant.findById(id);
      if (!updatedRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      // Update each field individually
      Object.keys(updateData).forEach((key) => {
        updatedRestaurant[key] = updateData[key];
      });
      await updatedRestaurant.save();
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant by ID:", error);
      res.status(500).json({ error: "Failed to update restaurant" });
    }
  }
);

app.delete(
  "/api/restaurants/:id",
  
  authorizeUser,
  async (req, res) => {
    try {
      const deletedRestaurant = await Restaurant.findByIdAndDelete(
        req.params.id
      );
      if (!deletedRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      console.error("Error deleting restaurant by ID:", error);
      res.status(500).json({ error: "Failed to delete restaurant" });
    }
  }
);

// Define other routes and middleware below

// Search route
// Protect this route by requiring authentication and authorization
app.get('/search', validateParams, async (req, res) => {
  try {
    const { page, perPage, borough } = req.query;
    const restaurants = await Restaurant.find({ borough })
      .skip((parseInt(page) - 1) * parseInt(perPage))
      .limit(parseInt(perPage));
    res.render('index', { restaurants });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

//to get all restaurants with and without parameters
app.get('/api/restaurants', validateParams,async (req, res, next) => {
  try {
    let { page, perPage, borough, cuisine } = req.query;

    // Convert to integers if provided
    if (page) page = parseInt(page);
    if (perPage) perPage = parseInt(perPage);

    // Create a filter object based on the provided parameters
    const filter = {};
    if (borough) filter.borough = borough;
    if (cuisine) filter.cuisine = cuisine;

    // Fetch restaurants based on the filter, page, and perPage values
    let restaurants;
    if (Object.keys(filter).length === 0) {
      // If no filter parameters are provided, fetch all restaurants
      restaurants = await Restaurant.find({})
        .skip((page - 1) * perPage)
        .limit(perPage);
    } else {
      // Fetch restaurants based on the filter parameters
      restaurants = await Restaurant.find(filter)
        .skip((page - 1) * perPage)
        .limit(perPage);
    }

    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});










// GET route for fetching a restaurant by ID
app.get("/api/restaurants/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant by ID:", error);
    res.status(500).json({ error: "Failed to fetch restaurant" });
  }
});

//GET route to fetch restaurants by cuisine
app.get(
  "/api/restaurants/cuisine/:cuisine",
  validateParams,
  async (req, res) => {
    try {
      const { cuisine } = req.params;
      let { page, perPage } = req.query;
      page = parseInt(page) || 1;
      perPage = parseInt(perPage) || 10;

      const skip = (page - 1) * perPage;

      const restaurants = await Restaurant.find({ cuisine })
        .skip(skip)
        .limit(perPage);

      res.json(restaurants);
    } catch (error) {
      console.error("Error fetching restaurants by cuisine:", error);
      res.status(500).json({ error: "Failed to fetch restaurants by cuisine" });
    }
  }
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});



// Start the server after initializing the database connection
initializeDatabase().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
