var Earthlike = function() {

    // We will be using 2048x1024 textures.
    var textureWidth = 2048, textureHeight = 1024;

    // ProcGen is a helper object we will be using to generate those textures.
    var procgen = ProcGen(textureWidth, textureHeight);

    // =============================================================================================
    // =============================================================================================

    /**
     * This function here is the meat of the whole procedural generation, and the
     * place where we'll implement all our logic.
     */
    function generateEarthlikePlanet(randomize) {
        // generate a granite-like random texture
        var colorMap = procgen.makeRGBMap(function(x,y) {
            var brightness = randomInRange(80, 160);
            // uncomment this for a different simple texture: var brightness = 128 + Math.sin((x+y) * 0.1) * 64;
            return rgb(brightness, 0, 0);
        });

        return {
            // we return our own color map
            colorMap: colorMap,

            // we use boring defaults for everything else
            displacementMap: procgen.defaultDisplacementMap(),
            bumpMap: procgen.defaultBumpMap(),
            lightMap: procgen.defaultLightMap()
        };
    }

    // =============================================================================================
    // =============================================================================================

    // Return the generation function.
    return generateEarthlikePlanet;
}();
