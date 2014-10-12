
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

        var WaterThreshold = 0.1, LandRange = 1.0 - WaterThreshold;

        var heightMap = procgen.derivedFloat([rawHeight], function(rawH) {
            if (rawH < WaterThreshold)
                return 0.98;
            else
                return 1.0 + 0.1 * (rawH - WaterThreshold) / LandRange;
        });

        var colorMap = procgen.derivedRGB([rawHeight], function(rawHeight) {
            if (rawHeight > 0.105)
                return rgb(150 + rawHeight * 40, 90 + rawHeight * 60, 30 + rawHeight * 40);
            else
                return rgb(40, 40, 130 + rawHeight * 40);
        });

        return {
            heightMap: heightMap,
            colorMap: colorMap
        }
    }
}();
