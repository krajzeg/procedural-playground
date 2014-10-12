
var Earthlike = function() {

    // We will be using 1024 x 512 textures.
    var textureWidth = 1024, textureHeight = 512;

    // ProcGen is a helper object we will be using to generate those textures.
    var procgen = ProcGen(textureWidth, textureHeight);

    // Return the generation function.
    return generateEarthlikePlanet;

    /**
     * This function here is the meat of the whole procedural generation.
     */
    function generateEarthlikePlanet() {

        var seed = Math.random() * 32767.0;
        var rawHeight = procgen.simplexNoise(seed, 7, 1.0);

        var WaterThreshold = 0.2, LandRange = 1.0 - WaterThreshold;

        var heightMap = procgen.derivedFloat([rawHeight], function(rawH) {
            if (rawH < WaterThreshold)
                return 0.98;
            else
                return 1.0 + 0.1 *(rawH - WaterThreshold) / LandRange;
        });

        var colorMap = procgen.derivedRGB([rawHeight], function(rawHeight) {
            if (rawHeight > WaterThreshold)
                return rgb(150, 90, 30);
            else
                return rgb(20 + rawHeight * 20, 20 + rawHeight * 20, 120 + rawHeight * 60);
        });

        var BumpMapping90DegreeTilt = 0.03;
        var bumpMap = procgen.rgbFromXY(function(x, y) {
            var left = (x + textureWidth - 1) % textureWidth, right = (x + 1) % textureWidth;
            var up = (y + textureHeight - 1) % textureHeight, down = (y + 1) % textureHeight;

            var h = heightMap.get(x,y), hL = heightMap.get(left,y), hR = heightMap.get(right, y),
                hU = heightMap.get(x,up), hD = heightMap.get(x, down);

            var xTilt = clamp( ((hL - h) + (h - hR)) / BumpMapping90DegreeTilt, -1.0, 1.0),
                yTilt = clamp( ((hU - h) + (h - hD)) / BumpMapping90DegreeTilt, -1.0, 1.0);

            var r = 128 + xTilt * 127, g = 128 + yTilt * 127;

            return rgb(r, g, 0);
        });

        return {
            heightMap: heightMap,
            colorMap: colorMap,
            bumpMap: bumpMap
        }
    }
}();
