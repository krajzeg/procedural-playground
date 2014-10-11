var Buffers = function(){

    var FloatBuffer = {
        getFloat: function(x,y) {
            return this[y * this.width + x];
        },

        setFloat: function(x, y, value) {
            this[y * this.width + x] = value;
        }
    };
    FloatBuffer.__proto__ = Float32Array;
    function createFloatBuffer(width, height) {
        var array = new Float32Array(width * height);
        array.width = width;
        array.height = height;
        array.__proto__ = FloatBuffer;
        return array;
    }

    RGBBuffer.__proto__ = Uint32Array;
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
        }
    };
}();