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
        // =====================================================
        // input - generate a raw height map using Simplex noise

        // random seed to make the noise different each time
        var seed = randomInRange(0, 1000000);
        if (!randomize)
            seed = 348573;

        // generate - 6 octaves to get enough detail, and standard "roughness"
        var rawHeight = procgen.simplexNoise(seed, 6, 1.0);

        // =====================================================
        // color map - visualise the Simplex noise directly for now

        var colorMap = procgen.makeRGBMap([rawHeight], function(rawHeight) {
            // map from (-1.0:1.0) to (0,255) for display
            var gray = lerp(rawHeight, /*from*/ -1.0, 1.0, /*to*/ 0, 255);
            return rgb(gray, gray, gray);
        });

        // =====================================================
        // return everything to the engine

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
