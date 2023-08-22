import Express from "express";
import { getHome } from "../controllers/user.js";

export const router = Express.Router();

router.get("/", getHome);