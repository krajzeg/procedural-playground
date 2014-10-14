
var Earthlike = function() {

    // We will be using 1024 x 512 textures.
    var textureWidth = 2048, textureHeight = 1024;

    // ProcGen is a helper object we will be using to generate those textures.
    var procgen = ProcGen(textureWidth, textureHeight);

    // Return the generation function.
    return generateEarthlikePlanet;

    /**
     * This function here is the meat of the whole procedural generation.
     */
    function generateEarthlikePlanet(randomize) {

        // =================================================================
        // input - raw height map + an additional map used for perturbations

        var seed = Math.random() * 32767.0;

        var rawHeight = procgen.simplexNoise(Math.random() * 32767, 6, 1.0);
        var variationMap = procgen.simplexNoise(Math.random() * 32767, 3, 4.0);

        // ===========================================================
        // height map

        var WaterThreshold = 0.1;
        var MountainSteepness = 2.0;
        var MaxAltitude = 1.0;
        if (randomize) {
            WaterThreshold = randomInRange(-0.5, 0.5);
            MountainSteepness = randomInRange(1.0, 2.5);
            MaxAltitude = randomInRange(0.8,1.2);
            console.log(WaterThreshold, MountainSteepness);
        }
        var LandRange = 1.0 - WaterThreshold;

        var heightAboveSeaMap = procgen.makeFloatMap([rawHeight], function(rawH) {
            if (rawH < WaterThreshold)
                return 0.0; // everything below water is at sea level, by definition :)
            else
                return MaxAltitude * Math.pow((rawH - WaterThreshold) / LandRange, MountainSteepness);
        });

        var DisplacementSize = 0.2;
        var displacementMap = procgen.makeFloatMap([heightAboveSeaMap], function(height) {
            if (!height) {
                return 0.985;
            }
            else
                return 1.0 + height * DisplacementSize;
        });

        // ===========================================================
        // bump map

        var BumpMappingHardness = 0.1 * DisplacementSize;
        var bumpMap = procgen.makeRGBMap([], function(x, y) {
            var left = (x + textureWidth - 1) % textureWidth, right = (x + 1) % textureWidth;
            var up = (y + textureHeight - 1) % textureHeight, down = (y + 1) % textureHeight;

            var hL = displacementMap.get(left,y), hR = displacementMap.get(right, y),
                hU = displacementMap.get(x,up), hD = displacementMap.get(x, down);

            var xTilt = clamp( (hL - hR) / BumpMappingHardness, -1.0, 1.0),
                yTilt = clamp( (hU - hD) / BumpMappingHardness, -1.0, 1.0);

            var r = 128 + xTilt * 127, g = 128 + yTilt * 127;

            return rgb(r, g, 0);
        });

        // ===========================================================
        // temperature map

        var PlanetClimate = 0.0,
            ColdnessWithAltitude = 90.0,
            TemperatureLocalVariation = 10.0;
        if (randomize) {
            PlanetClimate = randomInRange(-30.0, +30.0);
            ColdnessWithAltitude = randomInRange(40.0, 140.0);
        }
        var EquatorTemperature = 40.0 + PlanetClimate, PoleTemperature = -20.0 + PlanetClimate;
        var equatorY = textureHeight / 2;

        var temperatureMap = procgen.makeFloatMap([heightAboveSeaMap, variationMap], function(heightAboveSea, variation, x, y) {
            if (!heightAboveSea) return 10.0;

            var temperature = lerp(Math.abs(y - equatorY), 0, equatorY, EquatorTemperature, PoleTemperature);
            temperature += TemperatureLocalVariation * variation;
            temperature -= heightAboveSea * ColdnessWithAltitude;

            return temperature;
        });

        // ===========================================================
        // terrain map

        var GRASS = 0, SAND = 1, ROCK = 2, SNOW = 3, WATER = 4;
        var RockHeight = 0.05, SandTemperature = 25.0;
        if (randomize) {
            RockHeight = randomInRange(0.03, 0.2);
            SandTemperature += randomInRange(-10.0, 10.0);
        }
        var terrainMap = procgen.makeIntMap([heightAboveSeaMap, temperatureMap], function(height, temperature) {
            // below sea level?
            if (!height) return WATER;

            // fuzzy pick actual terrain
            var snowChance = clamp(lerp(temperature, 1.0, -2.0, 0.0, 1.0), 0.0, 1.0);
            var sandChance = clamp(Math.pow((temperature - SandTemperature) / 10.0, 3.0), 0.0, 1.0);
            var rockChance = clamp(clamp((height - RockHeight) / 0.05, 0.0, 1.0) - snowChance - sandChance, 0.0, 1.0);
            var grassChance = clamp(1 - rockChance - sandChance - snowChance, 0.0, 1.0);

            return fuzzyPick([grassChance, sandChance, rockChance, snowChance])
        });

        // ===========================================================
        // lighting map
        var LightingCoefficients = [
            rgb(32, 224, 10), // grass
            rgb(32, 224, 0),  // sand
            rgb(32, 224, 64), // rock
            rgb(32, 224, 196), // snow
            rgb(32, 224, 80), // water
        ];
        var lightMap = procgen.makeRGBMap([terrainMap], function(terrain) {
            return LightingCoefficients[terrain];
        });

        // ===========================================================
        // color map

        /*var colorMap = procgen.derivedRGB([rawHeight], function(h) {
            var v = 128 + 127 * h;
            return rgb(v,v,v);
        });*/

        /*var colorMap = procgen.derivedRGB([temperatureMap], function(temp) {
            var blueness = clamp(lerp(temp, 10.0, -30.0, 0, 255), 0, 255);
            var redness = clamp(lerp(temp, 10.0, 50.0, 0, 255), 0, 255);
            return rgb(redness, 64, blueness);
        });*/

        var RockColor1 = [160, 140, 110], RockColor2 = [210, 180, 160];
        var PaleGrass = {r: 130, g: 170, b: 130}, LushGrass = {r: 20, g: 100, b: 20};
        var colorMap = procgen.makeRGBMap([terrainMap, rawHeight], function(terrain, rawHeight, x, y) {
            // water
            if (terrain == WATER)
                return rgb(20 + rawHeight * 20, 20 + rawHeight * 20, 120 + rawHeight * 60);
            if (terrain == GRASS)
                return grass(x,y);
            if (terrain == SAND)
                return rgb(220, 180, 100);
            if (terrain == ROCK)
                return rock(x,y);
            if (terrain == SNOW)
                return rgb(220, 220, 255);
        });

        function rock(x, y) {
            var variation = variationMap.get(x,y);
            //var alpha = Math.abs((variation + 1.0) % 0.2 - 0.1) / 0.2 + (height - 1.0) * 8;
            var bandComponent = Math.abs((variation + 1.0) % 0.4 - 0.2) / 0.2;
            var randomComponent = randomInRange(-0.5, 0.5);
            alpha = clamp(bandComponent + randomComponent, 0.0, 1.0);

            var r = lerp(alpha, 0, 1, RockColor1[0], RockColor2[0]);
            var g = lerp(alpha, 0, 1, RockColor1[1], RockColor2[1]);
            var b = lerp(alpha, 0, 1, RockColor1[2], RockColor2[2]);

            if ((variation + 1.0 + x * 0.02) % 0.2 < 0.02) {
                r *= 0.75;
                g *= 0.75;
                b *= 0.75;
            }

            return rgb(r, g, b);
        }

        function grass(x, y) {
            var temperature = temperatureMap.get(x, y);
            var variation = variationMap.get(x * 2 % textureWidth, y * 2 % textureHeight);
            var alpha = clamp(lerp(temperature + variation * 13.0, 0.0, 30.0, 0.0, 1.0), 0.0, 1.0);

            var r = lerp(alpha, 0, 1, PaleGrass.r, LushGrass.r) + randomInRange(-5.0, 5.0) * alpha;
            var g = lerp(alpha, 0, 1, PaleGrass.g, LushGrass.g) + randomInRange(-10.0, 10.0) * alpha;
            var b = lerp(alpha, 0, 1, PaleGrass.b, LushGrass.b) + randomInRange(-5.0, 5.0) * alpha;

            return rgb(r,g,b);
        }


        return {
            heightMap: displacementMap,
            colorMap: colorMap,
            bumpMap: bumpMap,
            lightMap: lightMap
        }
    }
}();
