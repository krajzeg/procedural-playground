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
        // height above sea map - intermediate data, we use it for further processing
        var WaterLevel = 0.1;
        if (randomize) {
            WaterLevel = randomInRange(-0.25, 0.25);
        }
        var heightMap = procgen.makeFloatMap([rawHeight], function(rawHeight) {
            if (rawHeight > WaterLevel) {
                // above water - map to 0.0-1.0 range
                return lerp(rawHeight, /*from*/ WaterLevel, 1.0, /*to*/ 0.0, 1.0);
            } else {
                // below water - map to -1.0-0.0 range
                return lerp(rawHeight,   -1.0, WaterLevel,   -1.0, 0.0);
            }
        });

        // =====================================================
        // displacement map - add some shape to the ball

        var DisplacementSize = 0.1;
        var displacementMap = procgen.makeFloatMap([heightMap], function(height) {
            if (height <= 0.0) {
                // we "sink" the ocean even lower than 1.0 to make the land "pop" up
                // other than that, the ocean is flat, so it has a constant value
                return 0.985;
            } else {
                // for land, we use the height value to make mountains and flatlands
                return 1.0 + height * DisplacementSize;
            }
        });

        // =====================================================
        // color map - visualise the Simplex noise directly for now

        // color constants
        var WaterShallow = rgb(24, 24, 126), WaterDeep = rgb(0, 0, 60),
            LandLow = rgb(180, 140, 110), LandHigh = rgb(255, 240, 200);

        // generate based on land/water status
        var colorMap = procgen.makeRGBMap([heightMap], function(height) {
            if (height > 0.0) {
                // land!
                return colorLerp(height, 0.0, 1.0, LandLow, LandHigh);
            } else {
                // water!
                return colorLerp(height, -1.0, 0.0, WaterDeep, WaterShallow);
            }
        });

        // =====================================================
        // return everything to the engine

        return {
            // we return our own color map and displacement
            colorMap: colorMap,
            displacementMap: displacementMap,

            // we use boring defaults for everything else
            bumpMap: procgen.defaultBumpMap(),
            lightMap: procgen.defaultLightMap()
        };
    }

    // =============================================================================================
    // =============================================================================================

    // Return the generation function.
    return generateEarthlikePlanet;
}();
