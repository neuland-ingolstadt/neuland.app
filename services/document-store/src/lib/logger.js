import pinoLoggerFactory from "pino";
import {hostname} from "os";

const mainLogger = pinoLoggerFactory({
    level: process.env.LOG_LEVEL || "debug",
    base: {
        document_store: hostname() // or replace with whatever identifies the discovery service
    },
    redact: {
        paths: ["req"],
        remove: true
    }
});

export default mainLogger;
