

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer,canvas;


function init() {
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.01, 40 );
    camera.position.set( 0, 0, 1 );
    scene.add( camera );
    
    const controls = new OrbitControls( camera, renderer.domElement );
    controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    
    scene.add( new THREE.AxesHelper( 1 ) );
    
    const ambientlight = new THREE.AmbientLight( 0xffffff, 1.0 );
    scene.add( ambientlight );
    
    const pointLight = new THREE.PointLight( 0xff0000, 1, 100 );
    pointLight.position.set( 10, 10, 10 );
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
        
        //
        
        const gui = new GUI();
        
        gui.add( points.material, 'size', 0.001, 0.01 ).onChange( render );
        gui.addColor( points.material, 'color' ).onChange( render );
        gui.open();
        
        //
        
        
        
    } );
    
    const plyloader = new PLYLoader();
    plyloader.load( './out.ply', function ( geometry ) {
        
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial( { color: 0x009cff, flatShading: true } );
        const mesh = new THREE.Mesh( geometry, material );
        
        // mesh.position.y = - 0.2;
        // mesh.position.z = 0.3;
        // mesh.rotation.x = - Math.PI / 2;
        mesh.scale.multiplyScalar( 0.1 );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        scene.add( mesh );
        render();
    } );
    
    window.addEventListener( 'resize', onWindowResize );

}

init();
render();

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}

function render() {

    renderer.render( scene, camera );

}
