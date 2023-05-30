import {hasOwnProperties} from "../lib/document-store.js";
import {getSpo, setSpo} from "../repository/spo.js";
import {WrongParameterError} from "../errors/wrong-parameter-error.js";
import logger from "../lib/logger.js";

export async function storeSpo(req, res) {
    if (!hasOwnProperties(req.body, "spo")) {
        logger.error({req}, "store SPO called with wrong parameters");
        return res.status(400).json(new WrongParameterError("Wrong Parameter").toJson());
    }

    const {spo} = req.body;
    logger.debug({spo}, "store spo called");

    await setSpo(spo);

    res.sendStatus(200)
}

export async function retriveSpo(req, res) {
    logger.debug("retrive spo called");

    const spo = await getSpo();

    res.json(spo);
}