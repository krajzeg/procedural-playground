function createBallMesh(radius, slices, stacks) {
	var vertices = [], colors = [], normals = [], textureCoords = [];

	// create vertices
	for (var slice = 0; slice <= slices; slice++) {
		var longitude = Math.PI * (slice / slices - 0.5);
		var y = Math.sin(longitude) * radius;
		var scale = Math.cos(longitude);

		for (var stack = 0; stack <= stacks; stack++) {
			var latitude = 2 * Math.PI * (stack / stacks);
			var x = Math.cos(latitude) * scale * radius;
			var z = Math.sin(latitude) * scale * radius;

			vertices.push(x, y, z);
			colors.push(Math.abs(x), Math.abs(y), Math.abs(z));

            textureCoords.push(stack / stacks, slice / slices);

			var normal = [x,y,z];
			vec3.normalize(normal);
			normals.push.apply(normals, normal);
		}
	}

	// create index buffer
	var indices = [];
	var perSlice = stacks+1;
	for (slice = 0; slice < slices; slice++)
		for (stack = 0; stack < stacks; stack++) {
			// calculate indices of the corners
			var bl = slice * perSlice + stack;
			var br = bl + 1;
			var tl = bl + perSlice;
			var tr = tl + 1;

			// two triangles per 'quad'
			indices.push(tl, tr, bl, tr, br, bl);
		}

	return {
		vertices: vertices,
		colors: colors,
		normals: normals,
        textureCoords: textureCoords,
		indices: indices
	};
}
