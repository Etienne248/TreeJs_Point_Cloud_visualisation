import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 0, 5);
const canvas = document.getElementById("canvas");
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
const controls = new OrbitControls(camera, renderer.domElement);

const gui = new GUI();


scene.add(new THREE.AxesHelper(1));

const ambientlight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientlight);

const pointLight = new THREE.PointLight(0xffffff, 500, 1000);

pointLight.position.set(3, 3, 3);
scene.add(pointLight);
const pointLight1 = pointLight.clone();
pointLight1.position.set(-2, -2, -2);
scene.add(pointLight1);
const pointLight2 = pointLight.clone();
pointLight2.position.set(-2, 2, -2);
scene.add(pointLight2);
const pointLight3 = pointLight.clone();
pointLight3.position.set(2, 2, -2);
scene.add(pointLight3);

const sphereSize = 0.1;
const pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
scene.add(pointLightHelper);

const pcdloader = new PCDLoader();
pcdloader.load('./Zaghetto.pcd', function (points) {

    points.geometry.center();
    points.geometry.rotateX(Math.PI);
    points.name = 'Zaghetto.pcd';
    scene.add(points);

    points.visible = false


    const test = gui.addFolder('test');
    test.add(points.material, 'size', 0.001, 0.01)
    test.addColor(points.material, 'color')
    test.add(points, 'visible').name('visible')

});

let points
const plyloader = new PLYLoader();
plyloader.load('./out.ply', function (geometry) {

    // geometry.computeVertexNormals();

    //swap red and blue
    if (geometry.attributes.color) {
        var colors = geometry.attributes.color;
        for (var i = 0; i < colors.count; i++) {
            var r = colors.getX(i);
            var b = colors.getZ(i);
            colors.setXYZ(i, b, colors.getY(i), r); // Swapping red and blue
        }
    }
    

    // const material = new THREE.MeshStandardMaterial( { vertexColors: true, flatShading: true } );
    const material = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, sizeAttenuation: false });

    const shaderMaterial = new THREE.ShaderMaterial({
        // transparent: true,
        // depthWrite: false,

        vertexColors: true,
        uniforms: {
            size: { value: 3 },
            scale: { value: 1 },
            color: { value: new THREE.Color('white') }
        },
        vertexShader: THREE.ShaderLib.points.vertexShader,
        fragmentShader: `
        uniform vec3 color;
        varying vec3 vColor;
        void main() {
            vec2 xy = gl_PointCoord.xy - vec2(0.5);
            float ll = length(xy);
            if ( ll > 0.5 ) discard;
            gl_FragColor = vec4(vColor, 1.0);
            // gl_FragColor = vec4(vColor, step(ll, 0.5));
        }
        `
    });

    points = new THREE.Points(geometry, material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false

    // mesh.position.y = - 0.2;
    // mesh.position.z = 0.3;
    // mesh.rotation.x = - Math.PI / 2;
    points.scale.multiplyScalar(1);

    // mesh.castShadow = true;
    // mesh.receiveShadow = true;

    scene.add(points);
    scene.add(mesh);

    const PointCloud = gui.addFolder('PointCloud');
    PointCloud.add(material, 'size', 0.01, 3)
    PointCloud.add(points, 'visible').name('points')
    PointCloud.add(mesh, 'visible').name('mesh')
    PointCloud.add(points, 'material', { none: material, Custom_Shader: shaderMaterial }).name('Custom Shader')
    PointCloud.add(shaderMaterial.uniforms.size, 'value', 1, 15).name('CustomShaderSize')

    animate();
});

// const objloader = new OBJLoader();
// objloader.load(
//     "./SLR_Camera_V1_L3/10124_SLR_Camera_SG_V1_Iteration2.obj",
//     (obj) => {
//         // let mesh = obj.scene;
//         // obj.scale.set(50, 50, 50);
//         obj.traverse((node) => {
//             if (node.isMesh) {
//                 node.material = new THREE.MeshNormalMaterial();
//             }
//         })
//         obj.scale.setScalar( 0.001 );
//         obj.rotation.set(-Math.PI/2,0,Math.PI);
//         scene.add(obj);
//     },
//     (xhr) => {
//         console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
// 	},
//     (error) => {
//         console.log(error)
//     }
// )

const onProgress = function (xhr) {
    if (xhr.lengthComputable) {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log(percentComplete.toFixed(2) + '% downloaded');
    }
};


new MTLLoader()
    .setPath('./SLR_Camera_V1_L3/')
    .load('10124_SLR_Camera_SG_V1_Iteration2.mtl', function (materials) {

        materials.preload();

        new OBJLoader()
            .setMaterials(materials)
            .setPath('./SLR_Camera_V1_L3/')
            .load('10124_SLR_Camera_SG_V1_Iteration2.obj', function (object) {

                // object.position.y = - 0.95;
                object.rotation.set(-Math.PI / 2, 0, Math.PI);
                object.scale.setScalar(0.001);
                object.traverse((node) => {
                    if (node.isMesh) {
                        node.material.transparent = true;
                        node.material.opacity = 0.7;
                    }
                });
                scene.add(object);

            }, onProgress);

    });


const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.1, // strength
    0.1, // radius
    0.1 // threshold
);
const outputPass = new OutputPass();

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(outputPass);

const bloomFolder = gui.addFolder('bloom');
bloomFolder.add(bloomPass, 'threshold', 0.0, 1.0)
bloomFolder.add(bloomPass, 'strength', 0.0, 1.0)
bloomFolder.add(bloomPass, 'radius', 0.0, 1.0).step(0.01)

// const toneMappingFolder = gui.addFolder( 'tone mapping' );

// toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

//     renderer.toneMappingExposure = Math.pow( value, 4.0 );

// } );

gui.open();

const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.05;

let isDragging = false;
let pointerPosition = { x: 0, y: 0 };
window.addEventListener('pointermove', (event) => {
    pointerPosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerPosition.y = - (event.clientY / window.innerHeight) * 2 + 1;
    isDragging = true;
});


const sphereGeometry = new THREE.SphereGeometry(0.05, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, opacity: 0.01, transparent: true });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);


window.addEventListener('pointerdown', () => {
    isDragging = false;
});

const spherePositionWindow = document.createElement('div');
spherePositionWindow.style.position = 'absolute';
spherePositionWindow.style.top = '10px';
spherePositionWindow.style.left = '10px';
spherePositionWindow.style.padding = '5px';
spherePositionWindow.style.background = 'rgba(0, 0, 0, 0.5)';
spherePositionWindow.style.color = '#fff';
document.body.appendChild(spherePositionWindow);

window.addEventListener('pointerup', () => {
    if (!isDragging) {
        raycaster.setFromCamera(pointerPosition, camera);
        const intersects = raycaster.intersectObject(points, false);
        if (intersects.length > 0) {
            console.log(intersects[0]);
            sphere.material.opacity = 0.7;
            sphere.position.copy(intersects[0].point);
            spherePositionWindow.textContent = `Position: x: ${intersects[0].point.x.toFixed(2)}, y: ${intersects[0].point.y.toFixed(2)}, z: ${intersects[0].point.z.toFixed(2)}`;
        } else {
            sphere.material.opacity = 0;
            spherePositionWindow.textContent = '';
        }
    }
});


function animate() {
    requestAnimationFrame(animate);
    controls.update();


    // renderer.render(scene, camera);
    composer.render(scene, camera);
}

// animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize( window.innerWidth, window.innerHeight );
    renderer.setPixelRatio(window.devicePixelRatio);
})