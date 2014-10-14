window.Engine = function() {
    function Engine() {
        this.setupGL();
        this.setupShaders();
        this.setupBall();
        this.setupLight();
        this.setupState();
    }

    Engine.prototype = {
        setupGL: function () {
            // try to create a WebGL context
            var canvas = document.getElementById('main-canvas');

            var contextNames = ['webgl', 'experimental-webgl'];
            var gl;
            contextNames.map(function(name) {
            	if (!gl) gl = canvas.getContext(name);
            });
            if (!gl)
                throw "Unable to create a WebGL context, please use fresh Chrome or Firefox versions.";

            // try the OES_texture_float extension
            var extensions = ['OES_texture_float'];
            extensions.map(function(name) {
                var ext = gl.getExtension(name);
                if (!ext)
                    throw "GL extension '" + name + "' unsupported - please use fresh Chrome or Firefox version.";
            });

            // GL settings that will not change ever are set up below
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            window.gl = this.gl = gl;
            this.glu = GLUtils(gl);
        },

        setupShaders: function () {
            var gl = this.gl, glu = this.glu;
            this.shader = new glu.ShaderProgram(
                document.getElementById('shader-vertex').innerHTML,
                document.getElementById('shader-fragment').innerHTML
            );
        },

        setupBall: function () {
            var gl = this.gl, glu = this.glu;
            var mesh = createBallMesh(1, 150, 150);
            this.buffers = {
                position: new glu.Buffer(mesh.vertices, 3, gl.FLOAT),
                color: new glu.Buffer(mesh.colors, 3, gl.FLOAT),
                normals: new glu.Buffer(mesh.normals, 3, gl.FLOAT),
                textureCoords: new glu.Buffer(mesh.textureCoords, 2, gl.FLOAT),

                triangles: new glu.Buffer(mesh.indices, 1, gl.UNSIGNED_SHORT, gl.ELEMENT_ARRAY_BUFFER)
            };
        },

        setupLight: function () {
            var lightDir = [0.7, -0.7, -1];
            vec3.normalize(lightDir);
            this.lightVector = lightDir;
        },

        setupState: function () {
            this.stopped = false;
            this.rotation = 0.0;
        },

        start: function() {
            this.generatePlanet();
        },

        generatePlanet: function() {
            var self = this;

            if (self.worker)
                return;

            try {
                self.worker = new Worker('js/procgen/worker.js');
            } catch (e) {
                window.alert("Unable to create worker.\n" +
                "You have to setup a local server, security constraints prevent creating workers for pages opened from the filesystem.");
                return;
            }
            self.worker.addEventListener('message', function(evt) {
                var msg = evt.data;
                if (msg.type == 'done') {
                    self.worker.terminate();
                    self.worker = null;
                    self.useNewPlanet(msg.planet);
                }
            });
            var randomizeParams = document.getElementById("chk-randomize").checked;
            self.worker.postMessage({
                randomize: randomizeParams
            });

            document.dispatchEvent(new Event('updateState'));
        },

        useNewPlanet: function (planet) {
            var glu = this.glu;

            // free up old textures
            if (this.planet && this.planet.textures)
                _.map(this.planet.textures, function(texture) {
                    texture.destroy();
                });

            // set up new textures
            _.extend(planet, {
                textures: {
                    color: glu.Texture.fromRGBBuffer(planet.colorMap),
                    height: glu.Texture.fromFloatBuffer(planet.displacementMap),
                    bump: glu.Texture.fromRGBBuffer(planet.bumpMap),
                    lightParams: glu.Texture.fromRGBBuffer(planet.lightMap)
                }
            });

            this.planet = planet;
            document.dispatchEvent(new Event('updateState'));
        },

        toggleStopped: function() {
            this.stopped = !this.stopped;
            document.dispatchEvent(new Event('updateState'));
        },

        tick: function () {
            if (this.stopped)
                return;
            this.rotation -= 0.002;
        },

        render: function () {
            var gl = this.gl, glu = this.glu;

            // stopped?
            if (this.stopped)
                return;

            // clear the screen
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // is there a planet?
            if (!this.planet)
                return;

            // calculate projection matrices
            var mPerspective = mat4.create();
            mat4.perspective(45, 1, 0.1, 100.0, mPerspective);

            var mModel = mat4.create(), mRotation = mat4.create();
            mat4.identity(mModel);
            mat4.identity(mRotation);

            mat4.translate(mModel, [0, 0, -2.8]);

            mat4.rotateX(mModel, 0.4); mat4.rotateX(mRotation, 0.25);
            mat4.rotateZ(mModel, -0.2); mat4.rotateZ(mRotation, -0.2);
            mat4.rotateY(mModel, this.rotation); mat4.rotateY(mRotation, this.rotation);

            // select planet shader
            var shader = this.shader;
            shader.use();

            // configure it for drawing
            shader.set({
                mPerspective: mPerspective,
                mModel: mModel,
                mModelRotation: mRotation,

                // attribute sources for the ball
                aPosition: this.buffers.position,
                aColor: this.buffers.color,
                aNormal: this.buffers.normals,
                aTextureCoords: this.buffers.textureCoords,

                // lighting configuration
                uvLightDir: this.lightVector
            });
            shader.bindTextures({
                tColor: this.planet.textures.color,
                tHeight: this.planet.textures.height,
                tBump: this.planet.textures.bump,
                tLightParams: this.planet.textures.lightParams
            });

            // draw the planet!
            glu.drawTriangles(this.buffers.triangles);
        }
    };

    return Engine;
}();

Engine.planetTypes = {};
