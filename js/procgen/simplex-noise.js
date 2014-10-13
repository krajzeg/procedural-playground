/*
 * A speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This could be speeded up even further, but it's useful as it is.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

var SimplexNoise = function () {

    var floor = Math.floor;
    var Gradients3D = [
        [1, 1, 0],
        [-1, 1, 0],
        [1, -1, 0],
        [-1, -1, 0],
        [1, 0, 1],
        [-1, 0, 1],
        [1, 0, -1],
        [-1, 0, -1],
        [0, 1, 1],
        [0, -1, 1],
        [0, 1, -1],
        [0, -1, -1]
    ];

    var Permutations = [151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

    Permutations = Permutations.concat(Permutations); // wrap twice
    var PermutationsMod12 = Permutations.map(function (p) {
        return p % 12;
    });

    var Skew3D = 1 / 3, Unskew3D = 1 / 6;

    // ========================================================================================

    return {
        noise3D: noise3D,

        makeSpherical2DNoise: makeSpherical2DNoise,
        makeOctaveSphericalNoise: makeOctaveSphericalNoise
    };

    // ========================================================================================

    function makeOctaveSphericalNoise(seed, octaves, startingScale) {
        var seeds = new Array(octaves);
        for (var i = 0; i < octaves; i++) {
            seeds[i] = seed;
            seed = (seed * 15227 + 11699) % 32987;
        }

        return function(x, y) {
            var xSine = Math.sin(x), xCosine = Math.cos(x);

            var radius = startingScale * Math.sin(y);
            var sum = 0.0, noiseMultiplier = 0.5, yMultiplier = 2 * startingScale / Math.PI;

            for (var i = 0; i < octaves; i++) {
                sum += noiseMultiplier * noise3D(xSine * radius, y * yMultiplier, xCosine * radius + seeds[i]);
                radius *= 2;
                yMultiplier *= 2;
                noiseMultiplier *= 0.5;
            }

            return sum;
        };

        /*return function(x, y) {
            var multiplier = 0.5, sum = 0.0;
            for (var i = 0; i < octaves; i++) {
                sum += multiplier * noises[i](x, y);
                multiplier *= 0.5;
            }
            return sum;
        }*/
    }

    // ========================================================================================

    function makeSpherical2DNoise(seed, scale) {
        var Pi = Math.PI, TwoPi = Math.PI * 2;

        return function(x, y) {
            var xAngle = x * TwoPi;
            var yAngle = y * Pi;
            var radius = scale * Math.sin(yAngle);

            return noise3D(
                Math.sin(xAngle) * radius,
                y * 2 * scale,
                Math.cos(xAngle) * radius + seed
            );
        }
    }

    /*function makeSpherical2DNoise(seed, sphereWidth, sphereHeight) {
        var Pi = Math.PI;
        var angleMultiplier = Math.PI * 2 / sphereWidth;

        var radiusAtY = {};

        return function(x, y) {
            var xAngle = x * angleMultiplier;
            var radius = radiusAtY[y];
            if (!radius) {
                var yAngle = (y / sphereHeight) * Pi;
                radius = sphereWidth; // * Math.sin(yAngle);
                radiusAtY[y] = radius;
            }
            var mappedX = Math.sin(xAngle) * radius;
            var mappedZ = Math.cos(xAngle) * radius + seed;
            var mappedY = y;
            return noise3D(mappedX, mappedY, mappedZ);
        }
    }*/

    // ========================================================================================

    function noise3D(xin, yin, zin) {
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * Skew3D; // Very nice and simple skew factor for 3D
        var i = floor(xin + s);
        var j = floor(yin + s);
        var k = floor(zin + s);
        var t = (i + j + k) * Unskew3D;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            }
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            }
        }
        else {
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            }
        }

        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + Unskew3D; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + Unskew3D;
        var z1 = z0 - k1 + Unskew3D;
        var x2 = x0 - i2 + 2.0 * Unskew3D; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * Unskew3D;
        var z2 = z0 - k2 + 2.0 * Unskew3D;
        var x3 = x0 - 1.0 + 3.0 * Unskew3D; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * Unskew3D;
        var z3 = z0 - 1.0 + 3.0 * Unskew3D;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var gi0 = PermutationsMod12[ii + Permutations[jj + Permutations[kk]]];
        var gi1 = PermutationsMod12[ii + i1 + Permutations[jj + j1 + Permutations[kk + k1]]];
        var gi2 = PermutationsMod12[ii + i2 + Permutations[jj + j2 + Permutations[kk + k2]]];
        var gi3 = PermutationsMod12[ii + 1 + Permutations[jj + 1 + Permutations[kk + 1]]];
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            t0 *= t0;
            n0 = t0 * t0 * vec3.dot(Gradients3D[gi0], [x0, y0, z0]);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            t1 *= t1;
            n1 = t1 * t1 * vec3.dot(Gradients3D[gi1], [x1, y1, z1]);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            t2 *= t2;
            n2 = t2 * t2 * vec3.dot(Gradients3D[gi2], [x2, y2, z2]);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            t3 *= t3;
            n3 = t3 * t3 * vec3.dot(Gradients3D[gi3], [x3, y3, z3]);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }


}();
