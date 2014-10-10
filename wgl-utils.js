var GLUtils = function(glContext) {

	var gl = glContext;

	// ============ constants

	var UniformSetters = {
		'vec1': 'uniform1fv',
		'vec2': 'uniform2fv',
		'vec3': 'uniform3fv',
		'vec4': 'uniform4fv'
	}

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

		bindAttribute: function(name, buffer) {
			var attribute = this.attributes[name];
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer.id);
			gl.vertexAttribPointer(attribute.location, buffer.itemSize, buffer.type, false, 0, 0);
		},

		setUniform: function(name, value) {
			var uniform = this.uniforms[name];
			var setterName = UniformSetters[uniform.type];
			if (!setterName)
				throw "I don't know how to set uniforms of type " + uniform.type + ".";
			
			gl[setterName](uniform.location, value);
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

		drawTriangles: drawTriangles
	}
};