importScripts(
    '../../bower_components/underscore/underscore.js',
    '../../bower_components/gl-matrix/gl-matrix.js',
    '../numeric-utils.js',
    '../procgen/simplex-noise.js',
    '../procgen/texture-buffers.js',
    '../procgen/procgen.js',
    '../playground/main.js'
);

self.addEventListener('message', function(msg) {
    var planet = Earthlike(msg.data.randomize);
    self.postMessage(
        {type: 'done', planet: planet}
    );
});
