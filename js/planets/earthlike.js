
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
    function generateEarthlikePlanet() {

        var seed = Math.random() * 32767.0;
        var rawHeight = procgen.simplexNoise(Math.random() * 32767, 6, 1.0);
        var variationMap = procgen.simplexNoise(Math.random() * 32767, 3, 4.0);

        // ===========================================================
        // height map

        var WaterThreshold = 0.1, LandRange = 1.0 - WaterThreshold;
        var LandHeight = 0.2, MountainSteepness = 2.0;
        var heightMap = procgen.makeFloatMap([rawHeight], function(rawH) {
            if (rawH < WaterThreshold)
                return 0.98;
            else
                return 1.0 + LandHeight * Math.pow((rawH - WaterThreshold) / LandRange, MountainSteepness);
        });

        // ===========================================================
        // bump map

        var BumpMapping90DegreeTilt = 0.02;
        var bumpMap = procgen.makeRGBMap([], function(x, y) {
            var left = (x + textureWidth - 1) % textureWidth, right = (x + 1) % textureWidth;
            var up = (y + textureHeight - 1) % textureHeight, down = (y + 1) % textureHeight;

            var h = heightMap.get(x,y), hL = heightMap.get(left,y), hR = heightMap.get(right, y),
                hU = heightMap.get(x,up), hD = heightMap.get(x, down);

            var xTilt = clamp( ((hL - h) + (h - hR)) / BumpMapping90DegreeTilt, -1.0, 1.0),
                yTilt = clamp( ((hU - h) + (h - hD)) / BumpMapping90DegreeTilt, -1.0, 1.0);

            var r = 128 + xTilt * 127, g = 128 + yTilt * 127;

            return rgb(r, g, 0);
        });

        // ===========================================================
        // temperature map

        var PlanetClimate = 25.0;
        var EquatorTemperature = 40.0 + PlanetClimate, PoleTemperature = -20.0 + PlanetClimate,
            ColdnessWithAltitude = 90.0 / LandHeight,
            TemperatureLocalVariation = 10.0;
        var equatorY = textureHeight / 2;

        var temperatureMap = procgen.makeFloatMap([heightMap, variationMap], function(height, variation, x, y) {
            if (height < 1.0) return 10.0;
            var heightAboveSea = height - 1.0;

            var temperature = lerp(Math.abs(y - equatorY), 0, equatorY, EquatorTemperature, PoleTemperature);
            temperature += TemperatureLocalVariation * variation;
            temperature -= heightAboveSea * ColdnessWithAltitude;

            return temperature;
        });

        // ===========================================================
        // terrain map

        var GRASS = 0, SAND = 1, ROCK = 2, SNOW = 3, WATER = 4;
        var RockHeight = 1.0 + LandHeight * 0.05;
        var terrainMap = procgen.makeIntMap([heightMap, temperatureMap], function(height, temperature) {
            // below sea level?
            if (height < 1.0) return WATER;

            // fuzzy pick actual terrain
            var snowChance = clamp(lerp(temperature, 1.0, -2.0, 0.0, 1.0), 0.0, 1.0);
            var sandChance = clamp(Math.pow((temperature - 25.0) / 10.0, 3.0), 0.0, 1.0);
            var rockChance = clamp(clamp((height - RockHeight) / 0.01, 0.0, 1.0) - snowChance - sandChance, 0.0, 1.0);
            var grassChance = clamp(1 - rockChance - sandChance - snowChance, 0.0, 1.0);

            return fuzzyPick([grassChance, sandChance, rockChance, snowChance])
        });

        // ===========================================================
        // lighting map
        var LightingCoefficients = [
            rgb(16, 240, 10), // grass
            rgb(16, 240, 0),  // sand
            rgb(16, 240, 64), // rock
            rgb(32, 224, 196), // snow
            rgb(16, 240, 128), // water
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

        var colorMap = procgen.makeRGBMap([terrainMap, rawHeight], function(terrain, rawHeight) {
            // water
            if (terrain == WATER)
                return rgb(20 + rawHeight * 20, 20 + rawHeight * 20, 120 + rawHeight * 60);
            if (terrain == GRASS)
                return rgb(60, 160, 60);
            if (terrain == SAND)
                return rgb(220, 180, 100);
            if (terrain == ROCK)
                return rgb(127, 127, 127);
            if (terrain == SNOW)
                return rgb(255, 255, 255);
        });



        return {
            heightMap: heightMap,
            colorMap: colorMap,
            bumpMap: bumpMap,
            lightMap: lightMap
        }
    }
}();
