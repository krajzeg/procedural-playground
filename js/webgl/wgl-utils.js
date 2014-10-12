var GLUtils = function(glContext) {

	var gl = glContext;

	// ============ constants

	var UniformSetters = {
		'float': gl.uniform1f,
		'vec1': gl.uniform1fv,
		'vec2': gl.uniform2fv,
		'vec3': gl.uniform3fv,
		'vec4': gl.uniform4fv,

        'mat4': function(uniform, value) { gl.uniformMatrix4fv(uniform, false, value); },

        'sampler2D': gl.uniform1i
	};
    var TextureUnits = _.map(_.range(0,32), function(number) {
        return gl["TEXTURE" + number];
    });

	// ============ buffers

	function Buffer(array, itemSize, glItemType, bufferType) {
		bufferType = bufferType || gl.ARRAY_BUFFER;

		this.itemSize = itemSize;
        this.type = glItemType;
        this.length = array.length;

		var glBuffer = gl.createBuffer();
		this.id = glBuffer;

        switch(glItemType) {
        	case gl.FLOAT:
        		this.array = new Float32Array(array); break;
        	case gl.UNSIGNED_SHORT:
        		this.array = new Uint16Array(array); break;
        }

        gl.bindBuffer(bufferType, glBuffer);
        gl.bufferData(bufferType, this.array, gl.STATIC_DRAW);
	}

    // ============ texture

    function Texture(width, height, data, format) {
        format = format || Texture.RGBA;

        this.id = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, this.id);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

        gl.texImage2D(gl.TEXTURE_2D, 0, format.fromFormat, width, height, 0, format.toFormat, format.type, data);
        if (width == height) {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            var filtering = (format == Texture.FLOAT_LUMINANCE) ? gl.NEAREST : gl.LINEAR;
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtering);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtering);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    Texture.prototype = {
    	bind: function(where) {
    		gl.activeTexture(where);
        	gl.bindTexture(gl.TEXTURE_2D, this.id);
    	},
        destroy: function() {
            gl.deleteTexture(this.id);
        }
    };
    _.extend(Texture, {
        RGBA:  {fromFormat: gl.RGBA, toFormat: gl.RGBA, type: gl.UNSIGNED_BYTE},
        FLOAT_LUMINANCE: {fromFormat: gl.LUMINANCE, toFormat: gl.LUMINANCE, type: gl.FLOAT},

        fromRGBBuffer: function(buffer) {
            var byteArray = new Uint8Array(buffer.array.buffer);
            return new Texture(buffer.width, buffer.height, byteArray);
        },

        fromFloatBuffer: function(buffer) {
            return new Texture(buffer.width, buffer.height, buffer.array, Texture.FLOAT_LUMINANCE);
        }
    });

    // ============ shader support

	function ShaderProgram(vertexScript, fragmentScript) {
		this.attributes = {};
		this.uniforms = {};

		var vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexScript);
		var fragShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentScript);				
		var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
        
        this.program = shaderProgram;

        this.scanForVariables(vertexScript);
        this.scanForVariables(fragmentScript);
	}
	ShaderProgram.prototype = {	
		use: function() {
			gl.useProgram(this.program);
		},

		scanForVariables: function(shaderText) {
			var uniformRegExp = /uniform (\w+) (\w+);/g
			var attributeRegExp = /attribute (\w+) (\w+);/g

			var match;
			while (match = uniformRegExp.exec(shaderText)) {
				var name = match[2], type = match[1];
				var location = gl.getUniformLocation(this.program, name);
				this.uniforms[name] = {
					type: type,
					location: location
				};
			}

			while (match = attributeRegExp.exec(shaderText)) {
				var name = match[2], type = match[1];
				var location = gl.getAttribLocation(this.program, name);
				gl.enableVertexAttribArray(location);

				this.attributes[name] = {
					type: type,
					location: location
				};
			}
		},

		set: function(variablesToSet) {
			var self = this;

			_.map(variablesToSet, function(value, name) {
				if (self.attributes[name])
					return self.bindAttribute(name, value);
				if (self.uniforms[name])
					return self.setUniform(name, value);
				throw "Can't set '" + name + "' - it's not a known uniform or attribute.";
			});
		},

        bindTextures: function(textures) {
            var self = this;
            var index = 0;
            _.map(textures, function(texture, uniformName) {
                texture.bind(TextureUnits[index]);
                self.setUniform(uniformName, index);
                index++;
            });
        },

		bindAttribute: function(name, buffer) {
			var attribute = this.attributes[name];
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.id);
			gl.vertexAttribPointer(attribute.location, buffer.itemSize, buffer.type, false, 0, 0);
		},

		setUniform: function(name, value) {
			var uniform = this.uniforms[name];
			var setter = UniformSetters[uniform.type];
			if (!setter)
				throw "I don't know how to set uniforms of type " + uniform.type + ".";
			
			setter.apply(gl, [uniform.location, value]);
		},

		compileShader: function(type, text) {
			var shader = gl.createShader(type);

    		gl.shaderSource(shader, text);
    		gl.compileShader(shader);
    		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    			throw gl.getShaderInfoLog(shader);
	        }
	        return shader;
		}
	}


	function drawTriangles(buffer) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.id);
		gl.drawElements(gl.TRIANGLES, buffer.length, buffer.type, 0)
	}

	return {
		ShaderProgram: ShaderProgram,
		Buffer: Buffer,
        Texture: Texture,

		drawTriangles: drawTriangles
	}
};