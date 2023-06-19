import {getDocument, setDocument, SPO_KEY} from "../lib/redis.js";

// todo add caching

export async function setSpo(spoDocument) {
    try {
        await setDocument(SPO_KEY, spoDocument)
    } catch (e) {
        // todo add retry
        // todo add logger
    }

}

export async function getSpo() {
    try {
        return await getDocument(SPO_KEY);
    } catch (e) {
        // todo add logger
    }

}