importScripts(
    '../../bower_components/underscore/underscore.js',
    '../../bower_components/gl-matrix/gl-matrix.js',
    '../procgen/simplex-noise.js',
    '../procgen/texture-buffers.js',
    '../procgen/procgen.js',
    '../planets/earthlike.js'
);

self.addEventListener('message', function(msg) {
    var planet = Earthlike();

    console.log(planet.colorMap.array);

    self.postMessage(
        {type: 'done', planet: planet}
    );
});
