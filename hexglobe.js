const screenRatio = window.innerWidth / window.innerHeight;
const targetSize = 3;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera();
const renderer = new THREE.WebGLRenderer();

document.body.appendChild( renderer.domElement );
window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
	const screenRatio = window.innerWidth / window.innerHeight
	if (window.innerWidth < window.innerHeight) {
		camera.left = -targetSize ;
		camera.right = targetSize;
		camera.top = targetSize / screenRatio;
		camera.bottom = -targetSize / screenRatio;
		camera.near = window.innerWidth / -2,
		camera.far = 2;
	} else {
		camera.left = -targetSize * screenRatio;
		camera.right = targetSize * screenRatio;
		camera.top = targetSize;
		camera.bottom = -targetSize;
		camera.near = window.innerHeight / -2,
		camera.far = 2;
	}

	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}
onWindowResize();

const phi = (1 + Math.sqrt(5)) / 2;
const r = Math.sqrt(phi + 2);
const rho = r / Math.sqrt(3);

const a = Math.sqrt(phi + 1);
const b = rho * a;
const c = rho / (a);

const theta = Math.asin(Math.sqrt((phi - b) * (phi - b) + 1 + c * c) / r);
const ang = Math.asin(1 / r);

const sign = [-1, 1];
const steps = 10;
const basis = [
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(0, 0, 1),
];

const borderMaterial = new THREE.MeshPhongMaterial({color:0x0000cc})

function arcPoints(vertices, segments) {
	const points = [];
	for (let j = 1; j < vertices.length; j++) {
		const start = vertices[j - 1];
		const stop = vertices[j];
		points.push(start);
		for (let i = 1; i < segments; i++) {
			const t = i / segments;
			const v = new THREE.Vector3().addVectors(
				start.clone().multiplyScalar(1-t),
				stop.clone().multiplyScalar(t)
			).normalize().multiplyScalar(r);
			points.push(v);
		}
	}
	points.push(vertices[vertices.length - 1]);
	return points;
}

function createArc(base, end) {
	const torusMesh = new THREE.TorusGeometry(r, .05, 90, 60, theta);
	;
	
	const normal = new THREE.Vector3().crossVectors(base, end).normalize();
	const binormal = new THREE.Vector3().crossVectors(normal, base).normalize();
	const dir = base.clone().normalize();
	
	const mat = new THREE.Matrix4().set(
		dir.x, binormal.x, normal.x, 0,
		dir.y, binormal.y, normal.y, 0,
		dir.z, binormal.z, normal.z, 0,
		0, 0, 0, 1
	);
	
	torusMesh.applyMatrix4(mat);
	
	return new THREE.Mesh(torusMesh, borderMaterial);
}

function createPointBallsMeshes(points, radius) {
	return points.map(v => new THREE.Mesh(
		new THREE.SphereGeometry(radius).translate(v.x, v.y, v.z),
		borderMaterial
	));
}

function createD30Mesh() {
	const cubePoints = [...Array(8).keys()].map(i => (new THREE.Vector3(
		rho * sign[(i & 4) >> 2], rho * sign[(i & 2) >> 1], rho * sign[i & 1]
	)));

	const icosPoints = [];
	const dualPoints = [];
	for (let s_0 = 0; s_0 < 3; s_0++) {
		for (let i = 0; i < 2; i++) {
			const s_1 = (s_0 + 1) % 3;
			const s_2 = (s_0 + 2) % 3;
			for (let j = 0; j < 2; j++) {
				icosPoints.push(
					new THREE.Vector3(0, 0, 0).addVectors(
						basis[s_1].clone().multiplyScalar(sign[i] * phi),
						basis[s_2].clone().multiplyScalar(sign[j])
					)
				);
				dualPoints.push(
					new THREE.Vector3(0, 0, 0).addVectors(
						basis[s_1].clone().multiplyScalar(sign[i] * c),
						basis[s_2].clone().multiplyScalar(sign[j] * b)
					)
				)
			}
		}	
	}	

	let ijk = [0, 0, 0];

	const arcs = [];
	
	//to create edges, it is sufficient to generate based at each icos point
	icosPoints.forEach((v, n) => {
		const s = Math.floor(n / 4);
		const s_1 = (s + 1) % 3;
		const s_2 = (s + 2) % 3;
		const j = ((n - 4 * s) & 2) >> 1;
		const k = ((n - 4 * s) & 1);
		const cornerIdx = j * (1 << (2 - s_1)) + k * (1 << (2 - s_2));
		arcs.push(
			createArc(v, dualPoints[n]),
			createArc(v, dualPoints[4 * s_2 + j]),
			createArc(v, dualPoints[4 * s_2 + j + 2]),
			createArc(v, cubePoints[cornerIdx]),
			createArc(v, cubePoints[cornerIdx + (1 << (2 - s))])
		);
	});

	const globe = new THREE.Mesh(new THREE.SphereGeometry(r), new THREE.MeshLambertMaterial({color:0x008800}))
	const spheres = createPointBallsMeshes([...icosPoints, ...dualPoints, ...cubePoints], 0.1);
	return [globe,...spheres, ...arcs];
}

const lines = createD30Mesh();
scene.add(...lines);

const ambientLight = new THREE.AmbientLight( 0x808080, 0.4);
const pointLight = new THREE.PointLight(0xbbbb00, 2);
pointLight.position.set(- 2 * r, 1, 2 * r);
const spotLight = new THREE.SpotLight(0xdddddd, 3);
spotLight.position.set(2 * r, 0, 2 * r);
scene.add(ambientLight, pointLight, spotLight);

const animate = function () {
	requestAnimationFrame( animate );
	lines.forEach(l => {
		l.rotation.x += 0.01;
		l.rotation.y += 0.01;
		l.rotation.z += 0.01;
	});
	renderer.render( scene, camera );
};

animate();
