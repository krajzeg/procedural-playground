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

/**
 * Maps a value from one range to another range.
 *
 * @param value {number} the source value
 * @param sourceFrom {number} the low end of the source range
 * @param sourceTo {number} the high end of the source range
 * @param targetFrom {number} the low end of the target range to map into
 * @param targetTo {number} the high end of the target range to map into
 */
function lerp(value, sourceFrom, sourceTo, targetFrom, targetTo) {
    var alpha = (value - sourceFrom) / (sourceTo - sourceFrom);
    return targetFrom + alpha * (targetTo - targetFrom);
}

/**
 * Given an array of weights, picks one index randomly - with probability according
 * to the weights.
 *
 * @param {Array} weights floating point weights
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
