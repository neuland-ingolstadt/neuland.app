import {Router} from "express";
import {retriveSpo, storeSpo} from "../services/spo.js";

/**
 * API Router for the SPO
 */
const spoRouter = Router();

/**
 * @param {string} spo (JSON document)
 */
spoRouter.post("/documents/spo", storeSpo);

spoRouter.get("/documents/spo", retriveSpo);

export default spoRouter;
