/**
 * Clamps the number to the range low-high.
 * @param {number} number the number to clamp
 * @param {number} low the lowest acceptable value
 * @param {number} high the highest acceptable value
 * @returns {number} the number clamped to the acceptable range
 */
function clamp(number, low, high) {
    return (number < low) ? low : ((number > high) ? high : number);
}
