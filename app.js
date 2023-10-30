import path from "path";
import Express from "express";
import bodyParser from "body-parser";
import { router as userRoutes } from "./routes/user.js";
import { router as authRoutes } from "./routes/auth.js";
import { fileURLToPath } from "url";
import { appListen } from "./helpers/listen-app.js";
import ConnectMongoDBSession from "connect-mongodb-session";
import session from "express-session";
import { Campaign } from "./models/campaign.js";
import mongoose from "mongoose";
import { generateToken } from "./helpers/csrf.js";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import fs from "fs";

const MongoDBStore = ConnectMongoDBSession(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@payoutscluster.q9zysai.mongodb.net/${process.env.MONGO_DB}`;
console.log(URI);

const app = Express();
const store = new MongoDBStore({ uri: URI, collection: "sessions" });

app.set("view engine", "ejs");
app.set("views", "views");

const logStream = fs.createWriteStream(path.join(__dirname, "access.log"), {flags: 'a'})

app.use(compression());
app.use(morgan("combined", {stream: logStream}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(Express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "13RDn3U9LvxRDTY",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(async (req, res, next) => {
  try {
    res.locals.token = generateToken(req);
    res.locals.isAuthenticated = req.session.isLoggedIn;
    const loggedInUser = req.session.user;

    if (!loggedInUser) {
      return next();
    }
    const presentCampaign = await Campaign.where({
      ownerId: new mongoose.Types.ObjectId(loggedInUser._id),
    })
      .findOne()
      .populate("employeesData.employeeId");
    loggedInUser.campaign = presentCampaign;
    req.user = loggedInUser;
    next();
  } catch (error) {
    console.log(error);
    error.message = "Server bug";
    error.httpStatusCode = 500;
    return next(error);
  }
});

app.use(userRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
  //error middleware

  switch (error.message) {
    case "Signup error":
    case "Login error":
    case "Bad email":
    case "Bad password":
    case "Adding employee error":
    case "Editing employee error":
      let pageTitle;
      if (error.message === "Adding employee error") {
        pageTitle = "Dodaj pracownika";
      } else {
        pageTitle =
          error.message === "Signup error" ? "Zarejestruj się" : "Zaloguj się";
      }
      const errorContent = error.content;
      return res.status(error.httpStatusCode).render(error.view, {
        pageTitle: pageTitle,
        errors: errorContent.reasons,
        oldInput: errorContent.inputs,
        isUserSigned: errorContent.isUserSigned,
      });

    case "Server bug":
      res
        .status(error.httpStatusCode)
        .render("error/500", { pageTitle: "Błąd Serwera" });
      break;
    case "Forbidden operation":
      console.log(error);
      res
        .status(error.httpStatusCode)
        .render("error/403", { pageTitle: "Nie masz dostępu do tej strony" });
      break;
    case "Employee not found":
      console.log("in error");
      res.status(error.httpStatusCode).render("error/404", {
        pageTitle: "Użytkownik nie istnieje",
        message: "Ten użytkownik nie istnieje...",
      });
  }
});

app.use((req, res, next) => {
  res.status(404).render("error/404", {
    pageTitle: "Ta strona nie istnieje",
    message: "Strona o podanym url nie istnieje...",
  });
});

appListen(app, URI);
