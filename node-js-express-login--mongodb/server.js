const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const app = express();
var corsOptions = {
  origin: "http://localhost:4200"
};

app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(express.json());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "Spandan-session", // modified here
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Spandan's application." });
});

// open Mongoose connection to MongoDB database
// const dbConfig = require('./app/config/db.config')
const dbConfig = require("./app/config/db.config");
const db = require("./app/models");
const Role = db.role;
db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
        console.log("added 'admin' to roles collection");
      });
    }
  });
}
// initial() function helps us to create 3 important rows in roles collection.

const { authJwt } = require("./app/middlewares");
const controller = require("./app/controllers/user.controller");
// const dbConfig = require("./app/config/db.config");
module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });
  app.get("/api/test/all", controller.allAccess);
  app.get("/api/test/user", [authJwt.verifyToken], controller.userBoard);
  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );
  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );
};

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


// Explaination - 1
// – import express, cookie-session and cors modules:

// Express is for building the Rest apis
// cookie-session helps to stores the session data on the client within a cookie without requiring any database/resources on the server side
// cors provides Express middleware to enable CORS
// – create an Express app, then add request parsing, cookie-based session middleware and cors middlewares using app.use() method. Notice that we set origin: http://localhost:8081.
// – define a GET route which is simple for test.
// – listen on port 8080 for incoming requests.


// Explaination - 2
// app.use(
//     cookieSession({
//       name: "bezkoder-session",
//       // keys: ['key1', 'key2'], 
//       secret: "COOKIE_SECRET", // should use as secret environment variable
//       httpOnly: true
//     })
// );

// keys: sign & verify cookie values. Set cookies are always signed with keys[0], while the other keys are valid for verification, allowing for key rotation.
// secret: we don’t provide keys, so we use this as single key. In practice, you must provide value as secret environment variable (.env file for example) for security.
// httpOnly: indicate that the cookie is only to be sent over HTTP(S), and not made available to client JavaScript