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

const sign = [-1, 1];
const steps = 10;
const basis = [
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(0, 0, 1),
];

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

	const lines = [];
	const whiteMaterial = new THREE.LineBasicMaterial( { color: 0xffffff});
	const redMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
	for (let s_0 = 0; s_0 < 3; s_0++) {
		const s_1 = (s_0 + 1) % 3;
		const s_2 = (s_0 + 2) % 3;
		for (ijk[s_0] = 0; ijk[s_0] < 2; ijk[s_0]++) {
			// While just rendering edges, this is not needed.
			/*const icosEdgeFace = new THREE.BufferGeometry().
				setFromPoints([
					icosPoints[4 * s_0 + 2 * ijk[s_0]], 
					dualPoints[4 * s_2 + ijk[s_0]],
					icosPoints[4 * s_0 + 2 * ijk[s_0] + 1],
					dualPoints[4 * s_2 + 2 + ijk[s_0]],
					icosPoints[4 * s_0 + 2 * ijk[s_0]]
			]);
			lines.push(new THREE.Line(icosEdgeFace, whiteMaterial));*/
			
			for (ijk[s_1] = 0; ijk[s_1] < 2; ijk[s_1]++) {
				for (ijk[s_2] = 0; ijk[s_2] < 2; ijk[s_2]++) {
					const cubeIdx = 4 * ijk[0] + 2 * ijk[1] + ijk[2];
					const cubeHalfEdgeFace = new THREE.BufferGeometry().
						setFromPoints(
							arcPoints([
								cubePoints[cubeIdx], 
								icosPoints[4 * s_0 + 2 * ijk[s_1] + ijk[s_2]],
								dualPoints[4 * s_0 + 2 * ijk[s_1] + ijk[s_2]],
								icosPoints[4 * s_1 + 2 * ijk[s_2] + ijk[s_0]],
								cubePoints[cubeIdx]], 20
							)
						);
					lines.push(new THREE.Line(cubeHalfEdgeFace, redMaterial));
				}
			}
		}		
	}
	
	return lines;
}

const lines = createD30Mesh();
scene.add(...lines);

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
