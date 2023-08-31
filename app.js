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

app.use(userRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
  //error middleware

  switch (error.message) {
    case "Validator error":
      const errorContent = error.content;
      res
        .status(error.httpStatusCode)
        .render("auth/signup", {
          pageTitle: "Zarejestruj się",
          errors: errorContent.reasons,
          oldInput: errorContent.inputs,
        });
      break;

    case "Server bug":
      res
        .status(error.httpStatusCode)
        .render("error/500", { pageTitle: "Błąd Serwera" });
  }

});

appListen(app);
