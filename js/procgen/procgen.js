/**
 * Creates a 32-bit ABGR color based on just the 0-255 RGB values.
 * @param {number} r red component, 0-255
 * @param {number} g green component, 0-255
 * @param {number} b blue component, 0-255
 * @returns {number} a 32-bit ABGR value
 */
function rgb(r, g, b) {
    return 0xFF000000 | (b << 16) | (g << 8) | r;
}

ProcGen = function(textureWidth, textureHeight) {

    return {
        simplexNoise: simplexNoise,

        rgbFromXY: rgbFromXY,
        floatFromXY: floatFromXY,

        derivedRGB: derivedRGB,
        derivedFloat: derivedFloat
    };

    function simplexNoise(seed, octaveCount, roughness) {
        var scale = roughness / textureWidth;

        var baseNoise = function(innerSeed) {
            return SimplexNoise.makeXWrapped2dNoise(innerSeed, textureWidth * scale);
        };
        var octaveNoise = SimplexNoise.makeOctaveNoise(seed, baseNoise, octaveCount, scale);
        return floatFromXY(octaveNoise);
    }

    function rgbFromXY(fn) {
        return xyBuffer(Buffers.rgb(textureWidth, textureHeight), fn);
    }

    function floatFromXY(fn) {
        return xyBuffer(Buffers.float(textureWidth, textureHeight), fn);
    }

    function derivedRGB(sources, fn) {
        return derivedBuffer(sources, Buffers.rgb(textureWidth, textureHeight), fn);
    }

    function derivedFloat(sources, fn) {
        return derivedBuffer(sources, Buffers.float(textureWidth, textureHeight), fn)
    }

    function xyBuffer(target, fn) {
        var targetArray = target.array;
        var x = 0, y = 0, wrapX = textureWidth;
        var endLoc = textureWidth * textureHeight;
        for (var loc = 0; loc != endLoc; loc++) {
            targetArray[loc] = fn(x, y);
            if (++x == wrapX) {
                y++;
                x = 0;
            }
        }

        return target;
    }

    function derivedBuffer(sources, target, fn) {
        var args = new Array(sources.length), sourceCount = sources.length;
        var arrays = sources.map(function(source) {
            return source.array;
        });

        var targetArray = target.array;

        var endLoc = textureWidth * textureHeight;
        for (var loc = 0; loc != endLoc; loc++) {
            for (var i = 0; i < sourceCount; i++)
                args[i] = arrays[i][loc];
            targetArray[loc] = fn.apply(null, args);
        }

        return target;
    }


};
