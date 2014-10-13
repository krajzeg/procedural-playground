var Buffers = function(){

    var SingleValueMethods = {
        get: function(x,y) {
            return this.array[y * this.width + x];
        },

        set: function(x, y, v) {
            this.array[y * this.width + x] = v;
        }
    };

    function FloatBuffer(width, height) {
        this.array = new Float32Array(width * height);

        this.width = width;
        this.height = height;
    }
    FloatBuffer.prototype = _.extend({}, SingleValueMethods);

    function IntBuffer(width, height) {
        this.array = new Int16Array(width * height);

        this.width = width;
        this.height = height;
    }
    IntBuffer.prototype = _.extend({}, SingleValueMethods);


    function RGBBuffer(width, height) {
        this.array = new Uint32Array(width * height);

        this.width = width;
        this.height = height;
    }
    RGBBuffer.prototype = {
        getRGB: function(x,y) {
            var value = this.array[y * this.width + x];
            return {
                r: (value & 0xFF),
                g: (value & 0xFF00) >> 8,
                b: (value & 0xFF0000) >> 16
            };
        },

        setRGB: function(x, y, r, g, b) {
            this.array[y * this.width + x] =  0xFF000000 | (b << 16) | (g << 8) | r;
        },

        toTexture: function(glu) {
            var dataArray = new Uint8Array(this.array.buffer);
            return new glu.Texture(this.width, this.height, dataArray);
        }
    };

    return {
        rgb: function(width, height) {
            return new RGBBuffer(width, height);
        },

        float: function(width, height) {
            return new FloatBuffer(width, height);
        },

        int: function(width, height) {
            return new IntBuffer(width, height);
        }
    };
}();