// We will be using 1024 x 512 textures.
// Procgen is a helper object we will be using to generate them
var procgen = Generation(1024, 512);


function generatePlanet() {

    var baseNoiseFn = SimplexNoise.xWrappingNoise2D.bind(null, 1024 * 0.001);
    var noiseFn = SimplexNoise.summedNoise2D.bind(0, baseNoiseFn, 7, 0.001);
    var noise = procgen.floatFromXY(noiseFn);

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
