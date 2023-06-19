/**
 * Check if object has a list of properties
 * Just for ease of use
 * @param obj
 * @param props
 * @returns true false
 */
export function hasOwnProperties(obj, ...props) {
    for (const prop of props) {
        if (!obj.hasOwnProperty(prop)) return false;
    }
    return true;
}
