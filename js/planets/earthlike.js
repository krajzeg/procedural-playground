
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
        var rawHeight = procgen.simplexNoise(Math.random() * 32767, 7, 1.0);
        var variationMap = procgen.simplexNoise(Math.random() * 32767, 3, 4.0);

        // ===========================================================
        // height map

        var WaterThreshold = 0.2, LandRange = 1.0 - WaterThreshold;
        var LandHeight = 0.25, MountainSteepness = 2.0;
        var heightMap = procgen.derivedFloat([rawHeight], function(rawH) {
            if (rawH < WaterThreshold)
                return 0.98;
            else
                return 1.0 + LandHeight * Math.pow((rawH - WaterThreshold) / LandRange, MountainSteepness);
        });

        // ===========================================================
        // temperature map

        var EquatorTemperature = 40.0, PoleTemperature = -20.0,
            ColdnessWithAltitude = 80.0 / LandHeight,
            TemperatureLocalVariation = 10.0;
        var equatorY = textureHeight / 2;

        var temperatureMap = procgen.floatFromXY(function(x, y) {
            var height = heightMap.get(x,y);
            if (height < 1.0) return 10.0;
            var heightAboveSea = height - 1.0;

            var temperature = lerp(Math.abs(y - equatorY), 0, equatorY, EquatorTemperature, PoleTemperature);
            temperature += TemperatureLocalVariation * variationMap.get(x,y);
            temperature -= heightAboveSea * ColdnessWithAltitude;

            return temperature;
        });

        // ===========================================================
        // color map

        /*var colorMap = procgen.derivedRGB([temperatureMap], function(temp) {
            var blueness = clamp(lerp(temp, 10.0, -30.0, 0, 255), 0, 255);
            var redness = clamp(lerp(temp, 10.0, 50.0, 0, 255), 0, 255);
            return rgb(redness, 64, blueness);
        });*/
        var VegetationMaxHeight = 1.0 + LandHeight * 0.04;
        var colorMap = procgen.derivedRGB([rawHeight, heightMap, temperatureMap], function(rawHeight, height, temperature) {
            // water
            if (height < 1.0)
                return rgb(20 + rawHeight * 20, 20 + rawHeight * 20, 120 + rawHeight * 60);

            // land, pick base ground type
            var snowChance = clamp(lerp(temperature, -2, -7, 0, 1), 0, 1);
            var sandChance;
            if (temperature < 10.0)
                sandChance = 0.0;
            else
                sandChance = clamp(lerp(height, 1.0, 1.0 + temperature * 0.0001, 1.0, 0.0), 0, 1);

            var grassChance = clamp(1.0 - Math.abs(temperature - 17.0) / 20.0, 0.01, 1);

            var rockChance;
            if (temperature < -3.0)
                rockChance = 0;
            else
                rockChance = clamp( (height - VegetationMaxHeight) / 0.01, 0, 1);

            var terrain = fuzzyPick([snowChance, sandChance, grassChance, rockChance]);
            switch(terrain) {
                case 0: return rgb(255, 255, 255);
                case 1: return rgb(220, 200, 120);
                case 2: return rgb(60, 160, 60);
                case 3: return rgb(150, 160, 170);
            }
        });

        // ===========================================================
        // bump map

        var BumpMapping90DegreeTilt = 0.02;
        var bumpMap = procgen.rgbFromXY(function(x, y) {
            var left = (x + textureWidth - 1) % textureWidth, right = (x + 1) % textureWidth;
            var up = (y + textureHeight - 1) % textureHeight, down = (y + 1) % textureHeight;

            var h = heightMap.get(x,y), hL = heightMap.get(left,y), hR = heightMap.get(right, y),
                hU = heightMap.get(x,up), hD = heightMap.get(x, down);

            var xTilt = clamp( ((hL - h) + (h - hR)) / BumpMapping90DegreeTilt, -1.0, 1.0),
                yTilt = clamp( ((hU - h) + (h - hD)) / BumpMapping90DegreeTilt, -1.0, 1.0);

            var r = 128 + xTilt * 127, g = 128 + yTilt * 127;

            return rgb(r, g, 0);
        });

        return {
            heightMap: heightMap,
            colorMap: colorMap,
            bumpMap: bumpMap
        }
    }
}();
