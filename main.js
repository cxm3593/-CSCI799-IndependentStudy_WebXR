import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer, mesh, mesh2;
let controller;
let arToolkitContext, arToolkitSource, markerControls;



init();
initObject();
initARJS();
initInteractiveControl();
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
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.xr.enabled = true;
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
    // console.log("Camera:", camera.position, camera.visible);
    // console.log("Mesh:", mesh.position, mesh.visible);
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
        type : 'unknown',
        patternUrl : './image/pattern-star.patt',
        // type : 'nft',
        // descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix'
    })

    console.log('Pattern URL:', markerControls.parameters.patternUrl);
    console.log(markerControls);
    window.addEventListener('markerFound', function(ev){
        console.log('Marker found!', ev);
    });

    scene.visible = true;
}

function initInteractiveControl() {
    document.addEventListener('touchstart', onDocumentTouchStart, { passive: false });

    var touch = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();

    function onDocumentTouchStart(event) {
        if (event.touches.length > 0) {
            event.preventDefault();
    
            touch.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            touch.y = - (event.touches[0].clientY / window.innerHeight) * 2 + 1;
    
            // console.log("Touch: ", touch.x, touch.y);

            raycaster.setFromCamera(touch, camera);
    
            var intersects = raycaster.intersectObjects(scene.children);
            if (intersects.length > 0) {
                if (intersects[0].interactive = true){
                    // Use a random number for now
                    const r = Math.random();
                    const g = Math.random();
                    const b = Math.random();

                    const new_col = new THREE.Color(r, g, b);
                    intersects[0].object.material.color.set(new_col);

                }
            }
    
            
        }
    }
}

function initObject() {
    //// Set object
    const geometry = new THREE.BoxGeometry( 0.5,0.5,0.5);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh = new THREE.Mesh( geometry, material );
    mesh.interactive = true;
    mesh.position.set(0, 1, 0);

    const material2 = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh2 = new THREE.Mesh( geometry, material2 );
    mesh2.interactive = true;
    mesh2.position.set(0,-1,0);

    
    // mesh.position.y = geometry.parameters.height / 2 ;
    // mesh.visible = true;
    scene.add( mesh );
    scene.add(mesh2);
    // camera.add(mesh);
}