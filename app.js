import path from "path";
import Express from "express";
import bodyParser from "body-parser";
import { router as userRoutes } from "./routes/user.js";
import { router as authRoutes } from "./routes/auth.js";
import { fileURLToPath } from "url";
import { appListen } from "./helpers/listen-app.js";
import ConnectMongoDBSession from "connect-mongodb-session";
import session from "express-session";
import URI from "./URI.js";

const MongoDBStore = ConnectMongoDBSession(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Express();
const store = new MongoDBStore({ uri: URI, collection: "sessions" });

app.set("view engine", "ejs");
app.set("views", "views");

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

app.use(userRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
  //error middleware

  switch (error.message) {
    case "Signup error":
    case "Login error":
    case "Bad email":
    case "Bad password":
      console.log(error.content.reasons);
      const errorContent = error.content;
      return res.status(error.httpStatusCode).render(error.view, {
        pageTitle:
          error.message === "Signup error" ? "Zarejestruj się" : "Zaloguj się",
        errors: errorContent.reasons,
        oldInput: errorContent.inputs,
        isUserSigned: errorContent.isUserSigned,
      });

    case "Server bug":
      res
        .status(error.httpStatusCode)
        .render("error/500", { pageTitle: "Błąd Serwera" });
      break;
  }
});

appListen(app);
