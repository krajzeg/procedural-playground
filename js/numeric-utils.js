/**
 * Clamps the number to the range low-high to make sure it stays within the range.
 * @param {number} number the number to clamp
 * @param {number} low the lowest acceptable value
 * @param {number} high the highest acceptable value
 * @returns {number} the number clamped to the acceptable range
 * @example
 * clamp(1.3, 0.0, 1.0) => 1
 * clamp(0.6, 0.0, 1.0) => 0.6
 * clamp(-0.2, 0.0, 1.0) => 0
 */
function clamp(number, low, high) {
    return (number < low) ? low : ((number > high) ? high : number);
}

/**
 * Maps a value from one range to another range.
 *
 * @param value {number} the source value
 * @param sourceFrom {number} the low end of the source range
 * @param sourceTo {number} the high end of the source range
 * @param targetFrom {number} the low end of the target range to map into
 * @param targetTo {number} the high end of the target range to map into
 * @example
 * lerp(0.5,   0.0, 1.0,  0, 255) => 127.5
 * lerp(1,     0.0, 1.0,  0, 255) => 255
 * lerp(0,     0.0, 1.0,  64, 192) => 64
 */
function lerp(value, sourceFrom, sourceTo, targetFrom, targetTo) {
    var alpha = (value - sourceFrom) / (sourceTo - sourceFrom);
    return targetFrom + alpha * (targetTo - targetFrom);
}

/**
 * Maps a value from a numeric range to a range of colors
 *
 * @param value {number} the source value
 * @param sourceFrom {number} the low end of the source range
 * @param sourceTo {number} the high end of the source range
 * @param fromColor {number} the color corresponding to the low end
 * @param toColor {number} the color corresponding to the high end
 */
function colorLerp(value, sourceFrom, sourceTo, fromColor, toColor) {
    var a = (value - sourceFrom) / (sourceTo - sourceFrom), ia = 1 - a;
    var fromR = fromColor & 0xff, fromG = (fromColor & 0xff00) >> 8, fromB = (fromColor & 0xff0000) >> 16;
    var toR = toColor & 0xff, toG = (toColor & 0xff00) >> 8, toB = (toColor & 0xff0000) >> 16;
    var r = a * toR + ia * fromR, g = a * toG + ia * fromG, b = a * toB + ia * fromB;
    return rgb(r, g, b);
}

/**
 * Given an array of weights, picks one index randomly - with probability according
 * to the weights.
 *
 * @param {Array} weights floating point weights
 * @returns the selected index
 */
function fuzzyPick(weights) {
    var sum = 0;
    for (var i = 0; i < weights.length; i++) {
        sum += weights[i];
    };

    var determinator = Math.random() * sum;
    var index = 0;
    while (determinator > weights[index]) {
        determinator -= weights[index++];
    }

    return index;
}

/**
 * Returns a random float in the given range.
 * @param from the lowest number possible
 * @param to the highest number possible
 * @returns {number} uniform random number in the range
 */
function randomInRange(from, to) {
    return Math.random() * (to - from) + from;
}