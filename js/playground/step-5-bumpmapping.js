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

        // ===========================================================
        // bump map - make the light reflect correctly

        var BumpMappingHardness = 0.1 * DisplacementSize; // the lower this is, the more stark the effect
        var bumpMap = procgen.makeRGBMap([], function(x, y) {
            // calculate coordinates of our neighbours, wrapping correctly
            var left = (x + textureWidth - 1) % textureWidth, right = (x + 1) % textureWidth;
            var up = (y + textureHeight - 1) % textureHeight, down = (y + 1) % textureHeight;

            // get the height at our left, right, upper, lower neighbour
            var hL = displacementMap.get(left,y), hR = displacementMap.get(right, y),
                hU = displacementMap.get(x,up), hD = displacementMap.get(x, down);

            // calculate how much slope we have, and in which direction
            // this is clamped to (-1,1) so we never go past vertical :)
            var xTilt = clamp( (hR - hL) / BumpMappingHardness, -1.0, 1.0),
                yTilt = clamp( (hU - hD) / BumpMappingHardness, -1.0, 1.0);

            // translate this into R and G component for the bump map
            // x tilt is stored in red, y tilt is stored in green
            var r = lerp(xTilt, -1.0, 1.0, 0, 255), g = lerp(yTilt, -1.0, 1.0, 0, 255);
            return rgb(r, g, 0);
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
            // we have generated almost everything
            colorMap: colorMap,
            displacementMap: displacementMap,
            bumpMap: bumpMap,

            // defaults just for the light map
            lightMap: procgen.defaultLightMap()
        };
    }

    // =============================================================================================
    // =============================================================================================

    // Return the generation function.
    return generateEarthlikePlanet;
}();
