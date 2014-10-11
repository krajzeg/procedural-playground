function rgb(r, g, b) {
    return 0xFF000000 | (b << 16) | (g << 8) | r;
}

window.Generation = function(textureWidth, textureHeight) {

    return {
        floatFromXY: floatFromXY,
        derivedRGB: derivedRGB
    };

    function floatFromXY(fn) {
        var output = Buffers.float(textureWidth, textureHeight);
        var outputArray = output.array;
        var x = 0, y = 0, wrapX = textureWidth;
        var endLoc = textureWidth * textureHeight;
        for (var loc = 0; loc != endLoc; loc++) {
            outputArray[loc] = fn(x, y);
            if (++x == wrapX) {
                y++;
                x = 0;
            }
        }

        return output;
    }

    function derivedRGB(sources, fn) {
        var args = new Array(sources.length), sourceCount = sources.length;
        var arrays = sources.map(function(source) {
            return source.array;
        });

        var output = Buffers.rgb(textureWidth, textureHeight);
        var outputArray = output.array;

        var endLoc = textureWidth * textureHeight;
        for (var loc = 0; loc != endLoc; loc++) {
            for (var i = 0; i < sourceCount; i++)
                args[i] = arrays[i][loc];
            outputArray[loc] = fn.apply(null, args);
        }

        return output;
    }
};
