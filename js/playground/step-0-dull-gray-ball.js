
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
        // the textures we are going to generate will all be returned from here
        return {
            // we use boring defaults for everything, but we'll write something better soon!
            colorMap: procgen.defaultColorMap(),
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
