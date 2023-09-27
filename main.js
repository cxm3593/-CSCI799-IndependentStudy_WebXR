import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer;
let controller;
let arToolkitContext, arToolkitSource, markerControls;



init();
initARJS()
animate();

function init() {

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    //

    // document.body.appendChild( ARButton.createButton( renderer ) );
    
    //// Set controller
    controller = renderer.xr.getController( 0 );
    scene.add( controller );

    //// Set object
    const geometry = new THREE.CylinderGeometry( 0, 0.05, 0.2, 32 ).rotateX( Math.PI / 2 );
    const material = new THREE.MeshPhongMaterial( { color: 0xffffff * Math.random() } );
    const mesh = new THREE.Mesh( geometry, material );
    mesh.position.set( 0, 0, - 0.3 ).applyMatrix4( controller.matrixWorld );
    mesh.quaternion.setFromRotationMatrix( controller.matrixWorld );
    scene.add( mesh );

    window.addEventListener( 'resize', onWindowResize );

    window.addEventListener('arjs-nft-init-data', function(nft) {
        console.log(nft);
        var msg = nft.detail;
        mesh.position.y = (msg.height / msg.dpi * 2.54 * 10)/2.0; //y axis?
        mesh.position.x = (msg.width / msg.dpi * 2.54 * 10)/2.0; //x axis?
      })

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

function animate() {

    renderer.setAnimationLoop( render );

}

function render() {

    renderer.render( scene, camera );

}

function initARJS() {

    //// arToolContext ////
    arToolkitContext = new THREEx.ArToolkitContext({
        detectionMode: 'mono',
        canvasWidth: 480,
        canvasHeight: 640,
    }, {
        sourceWidth: 480,
        sourceHeight: 640,
    })

    // initialize it
    arToolkitContext.init(function onCompleted(){
        // copy projection matrix to camera
        camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
    })

    //// arToolkitSource ////
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
        sourceWidth: 480,
        sourceHeight: 640,
    })

    arToolkitSource.init(function onReady(){
        // use a resize to fullscreen mobile devices
        setTimeout(function() {
            onResize()
        }, 1000);
    })

    // handle resize
    window.addEventListener('resize', function(){
        onResize()
    })

    // listener for end loading of NFT marker
    window.addEventListener('arjs-nft-loaded', function(ev){
      console.log(ev);
    })

    function onResize(){
        arToolkitSource.onResizeElement()
        arToolkitSource.copyElementSizeTo(renderer.domElement)
        if( arToolkitContext.arController !== null ){
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas)
        }
    }


    //// arToolControl ////
    markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'nft',
        //patternUrl : 'resources/patt.hiro',
        descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix'
    })

    // scene.visible = false

    var root = new THREE.Object3D();
    scene.add(root);
}