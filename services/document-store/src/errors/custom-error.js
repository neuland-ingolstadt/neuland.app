export class CustomError extends Error {
    toJson() {
        return {
            name: this.name,
            message: this.message,
        }
    }
}
