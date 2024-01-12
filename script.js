import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 0, 5);
const canvas = document.getElementById("canvas");
const controls = new OrbitControls(camera, canvas);
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

const gui = new GUI();


scene.add( new THREE.AxesHelper( 1 ) );
    
const ambientlight = new THREE.AmbientLight( 0xffffff, 1.0 );
scene.add( ambientlight );

const pointLight = new THREE.PointLight( 0xffffff, 500, 1000 );
pointLight.position.set( 5, 5, 5 );
scene.add( pointLight );

const sphereSize = 1;
const pointLightHelper = new THREE.PointLightHelper( pointLight, sphereSize );
scene.add( pointLightHelper );

const loader = new PCDLoader();
loader.load( './Zaghetto.pcd', function ( points ) {
    
    points.geometry.center();
    points.geometry.rotateX( Math.PI );
    points.name = 'Zaghetto.pcd';
    scene.add( points );
    
    points.visible = false


    const test = gui.addFolder( 'test' );
    test.add( points.material, 'size', 0.001, 0.01 )
    test.addColor( points.material, 'color' )
    test.add(points,'visible').name('visible')    
    
} );

const plyloader = new PLYLoader();
plyloader.load( './out.ply', function ( geometry ) {
    
    // geometry.computeVertexNormals();
    
    // const material = new THREE.MeshStandardMaterial( { vertexColors: true, flatShading: true } );
    const material = new THREE.PointsMaterial( { size: 1.5, vertexColors: true, sizeAttenuation: false } );
    
    const shaderMaterial = new THREE.ShaderMaterial({
        // transparent: true,
        // depthWrite: false,

        vertexColors: true,
        uniforms: {
            size: {value: 3},
            scale: {value: 1},
            color: {value: new THREE.Color('white')}
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

    const mesh = new THREE.Points( geometry, material );

    const meshm = new THREE.Mesh( geometry, material );
    meshm.visible = false
    
    // mesh.position.y = - 0.2;
    // mesh.position.z = 0.3;
    // mesh.rotation.x = - Math.PI / 2;
    mesh.scale.multiplyScalar( 1 );
    
    // mesh.castShadow = true;
    // mesh.receiveShadow = true;

    scene.add( mesh );
    scene.add( meshm );

    const PointCloud = gui.addFolder( 'PointCloud' );
    PointCloud.add(material, 'size', 0.01, 3 )
    PointCloud.add(mesh,'visible').name('points')
    PointCloud.add(meshm,'visible').name('mesh')
    PointCloud.add(mesh,'material',{none: material, Custom_Shader:shaderMaterial}).name('Custom Shader')
    PointCloud.add(shaderMaterial.uniforms.size, 'value', 1, 15 ).name('CustomShaderSize')
} );

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

const bloomFolder = gui.addFolder( 'bloom' );
bloomFolder.add( bloomPass, 'threshold', 0.0, 1.0 )
bloomFolder.add( bloomPass, 'strength', 0.0, 1.0 )
bloomFolder.add( bloomPass, 'radius', 0.0, 1.0 ).step( 0.01 )

// const toneMappingFolder = gui.addFolder( 'tone mapping' );

// toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {

//     renderer.toneMappingExposure = Math.pow( value, 4.0 );

// } );


gui.open();

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    // renderer.render(scene, camera);
    composer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
})