import path from "path";
import Express from "express";
import bodyParser from "body-parser";
import { router as userRoutes } from "./routes/user.js";
import { router as authRoutes } from "./routes/auth.js";
import { fileURLToPath } from "url";
import { appListen } from "./helpers/listen-app.js";
import ConnectMongoDBSession from "connect-mongodb-session";
import session from "express-session";

const MongoDBStore = ConnectMongoDBSession(session);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const URI = `mongodb+srv://pejdzor:6Km0lLIVhe6q93pv@payoutscluster.q9zysai.mongodb.net/payoutsDB`;

const app = Express();
const store = new MongoDBStore({ uri: URI, collection: "sessions" });

app.set("view engine", "ejs");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(Express.static(path.join(__dirname, "public")));

app.use(userRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {          //error middleware
  console.log(error.content.reasons);
});

appListen(app);
