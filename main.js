import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer, mesh;
let controller;
let arToolkitContext, arToolkitSource, markerControls;



init();
initObject();
initARJS();
animate();

function init() {

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera();
    scene.add(camera);
    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 3 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    //

    renderer = new THREE.WebGLRenderer( {
        antialias: true, 
        alpha: true,
    } );
    //renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    //

    // document.body.appendChild( ARButton.createButton( renderer ) );
    
    //// Set controller
    // controller = renderer.xr.getController( 0 );
    // scene.add( controller );


    window.addEventListener( 'resize', onWindowResize );

    // window.addEventListener('arjs-nft-init-data', function(nft) {
    //     console.log(nft);
    //     var msg = nft.detail;
    //     mesh.position.y = (msg.height / msg.dpi * 2.54 * 10)/2.0; //y axis?
    //     mesh.position.x = (msg.width / msg.dpi * 2.54 * 10)/2.0; //x axis?
    //   })

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

    arToolkitContext.update(arToolkitSource.domElement);
    scene.visible = camera.visible;
    console.log("Camera:", camera.position);
    console.log("Mesh:", mesh.position);
    renderer.render( scene, camera );

}

function initARJS() {
    //// arToolkitSource ////
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
    })

    arToolkitSource.init(function onReady(){
        // use a resize to fullscreen mobile devices
        setTimeout(function() {
            onResize()
        }, 1000);
    })

    //// arToolContext ////
    arToolkitContext = new THREEx.ArToolkitContext({
        cameraParametersUrl: 'camera_para.dat',
        detectionMode: 'color_and_matrix'
    })

    // initialize it
    arToolkitContext.init(function onCompleted(){
        // copy projection matrix to camera
        camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
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
    var dummy = new THREE.PerspectiveCamera();
    markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'pattern',
        patternUrl : './image/pattern-star.patt',
        //descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix'
    })

    scene.visible = true;
}

function initObject() {
    //// Set object
    const geometry = new THREE.BoxGeometry( 1,1,1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    mesh = new THREE.Mesh( geometry, material );
    mesh.position.set(0, 0, -5);
    mesh.position.y = geometry.parameters.height / 2 ;
    mesh.visible = true;
    //scene.add( mesh );
    camera.add(mesh);
}