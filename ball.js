function createBallMesh(radius, slices, stacks) {
	var vertices = [], colors = [];

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
		}
	}

	// create index buffer
	var indices = [];
	var perSlice = stacks+1;
	for (var slice = 0; slice < slices; slice++)
		for (var stack = 0; stack < stacks; stack++) {
			// calculate indices of the corners
			var bl = slice * perSlice + stack;
			var br = bl + 1
			var tl = bl + perSlice
			var tr = tl + 1;

			// two triangles per 'quad'
			indices.push(bl, br, tl, tl, br, tr);
		}

	return {
		vertices: vertices,
		colors: colors,
		indices: indices
	};
}
