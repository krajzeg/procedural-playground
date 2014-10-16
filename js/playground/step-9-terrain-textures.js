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
            seed = 368579;

        // generate - 6 octaves to get enough detail, and standard "roughness"
        var rawHeight = procgen.simplexNoise(seed, 6, 1.0);

        // generate additional noise map for local variations in temperature and other things
        var variationMap = procgen.simplexNoise(Math.random() * 32767, 3, 4.0);

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
        // temperature map - this will come in useful later

        var PlanetClimate = 0.0,
            ColdnessWithAltitude = 80.0,
            TemperatureLocalVariation = 10.0;
        if (randomize) {
            PlanetClimate = randomInRange(-30.0, +30.0);
            ColdnessWithAltitude = randomInRange(40.0, 140.0);
        }
        var EquatorTemperature = 45.0 + PlanetClimate, PoleTemperature = -15.0 + PlanetClimate;
        var equatorY = textureHeight / 2;

        var temperatureMap = procgen.makeFloatMap([heightMap, variationMap], function(height, variation, x, y) {
            // we don't care about water temperature too much
            if (height < 0.0) return 10.0;

            // on land we base the temperature on how close to the equator we are
            var temperature = lerp(Math.abs(y - equatorY), 0, equatorY, EquatorTemperature, PoleTemperature);
            // then add some local variation
            temperature += TemperatureLocalVariation * variation;
            // but it gets colder in the mountains
            temperature -= height * ColdnessWithAltitude;

            return temperature;
        });

        // =====================================================
        // displacement map - add some shape to the ball

        var DisplacementSize = 0.2;
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

        // ===========================================================
        // terrain map - divide the globe into terrain types

        // our 5 types
        var GRASS = 0, SAND = 1, ROCK = 2, SNOW = 3, WATER = 4;

        // some constants
        var RockHeight = 0.2, SandTemperature = 23.0;
        if (randomize) {
            RockHeight = randomInRange(0.03, 0.2);
            SandTemperature += randomInRange(-10.0, 10.0);
        }

        var terrainMap = procgen.makeIntMap([heightMap, temperatureMap], function(height, temperature) {
            // below sea level?
            if (height < 0.0) return WATER;

            // determine the change of each type of terrain
            var snowChance = clamp(lerp(temperature, 1.0, -2.0, 0.0, 1.0), 0.0, 1.0);
            var sandChance = clamp(Math.pow((temperature - SandTemperature) / 10.0, 3.0), 0.0, 1.0);
            var rockChance = clamp(clamp((height - RockHeight) / 0.05, 0.0, 1.0) - snowChance - sandChance, 0.0, 1.0);
            var grassChance = clamp(1 - rockChance - sandChance - snowChance, 0.0, 1.0);

            // pick one of them
            return fuzzyPick([grassChance, sandChance, rockChance, snowChance])
        });

        // =====================================================
        // color map - visualise the Simplex noise directly for now

        // color constants
        var WaterShallow = rgb(24, 24, 126), WaterDeep = rgb(0, 0, 60),
            SandColor = rgb(220, 180, 100), SnowColor = rgb(220, 220, 255);

        var RockColor1 = rgb(160, 140, 110), RockColor2 = rgb(210, 180, 160);
        var PaleGrass = rgb(130, 170, 130), LushGrass = rgb(20, 100, 20);

        // generate based on terrain type
        var colorMap = procgen.makeRGBMap([terrainMap, heightMap], function(terrain, height, x, y) {
            switch(terrain) {
                case WATER: return colorLerp(height, -1.0, 0.0, WaterDeep, WaterShallow);

                case GRASS: return grass(x,y);
                case SAND: return SandColor;
                case SNOW: return SnowColor;
                case ROCK: return rock(x,y);
            }
        });

        // =====================================================
        // individual terrain type textures

        function rock(x, y) {
            // reuse the variation map
            var variation = variationMap.get(x,y);
            // make circular bands
            var bandComponent = Math.abs((variation + 1.0) % 0.2 - 0.1) / 0.1;
            // add random component to make it less artificial
            var randomComponent = randomInRange(-0.5, 0.5);
            // interpolate between two colors
            var alpha = clamp(bandComponent + randomComponent, 0.0, 1.0);
            return colorLerp(alpha, 0, 1, RockColor1, RockColor2);
        }

        function grass(x, y) {
            // grass will get more pale with lower temperature
            var temperature = temperatureMap.get(x, y);
            // we will use some local variation too
            var variation = variationMap.get(x * 2 % textureWidth, y * 2 % textureHeight);
            // interpolate between the two grass colors
            var alpha = clamp(
                    lerp(temperature + variation * 13.0, 0.0, 30.0, 0.0, 1.0)
                    + randomInRange(-0.2, 0.2),
                    0.0, 1.0);
            return colorLerp(alpha, 0, 1, PaleGrass, LushGrass);
        }

        // =====================================================
        // light map - controls the ambient, diffuse, specular coefficients of the light
        var LightingCoefficients = {};
        LightingCoefficients[GRASS] = rgb(32, 224, 10);  // grass - not reflective
        LightingCoefficients[SAND]  = rgb(32, 224, 0);   // sand - TOTALLY not reflective
        LightingCoefficients[ROCK]  = rgb(32, 224, 64);  // rock is a bit shiny
        LightingCoefficients[SNOW]  = rgb(32, 224, 196); // snow is very reflective, high specular makes it "glow" in light
        LightingCoefficients[WATER] = rgb(32, 224, 80);  // water is also pretty reflective
        var lightMap = procgen.makeRGBMap([terrainMap], function(terrain) {
            return LightingCoefficients[terrain];
        });

        // =====================================================
        // return everything to the engine

        return {
            // we have generated everything now!
            colorMap: colorMap,
            displacementMap: displacementMap,
            bumpMap: bumpMap,
            lightMap: lightMap
        };
    }

    // =============================================================================================
    // =============================================================================================

    // Return the generation function.
    return generateEarthlikePlanet;
}();
