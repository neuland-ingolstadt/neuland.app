import {CustomError} from "./custom-error.js";

export class WrongParameterError extends CustomError {
    constructor(...params) {
        super(...params);
        this.name = "WrongParameterError";
    }
}
