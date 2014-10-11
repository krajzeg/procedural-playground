
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
        var noise = procgen.simplexNoise(seed, 7, 1.0);

        var colorMap = procgen.derivedRGB([noise], function(noise) {
            if (noise > 0.105)
                return rgb(160 + noise * 40, 100 + noise * 60, noise * 80);
            else
                return rgb(40, 40, 130 + noise * 40);
        });

        return {
            colorMap: colorMap
        }
    }
}();
