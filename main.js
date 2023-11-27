import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

let camera, scene, renderer, mesh, mesh2, mesh3, mesh4, mesh5, mesh6;
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
        sourceWidth: 1270,
        sourceHeight: 720,
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
    markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'unknown',
        patternUrl : './image/pattern-cm1.patt',
        // type : 'nft',
        // descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix',
        minConfidence: 0.8,
    })

    markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'unknown',
        patternUrl : './image/pattern-star.patt',
        // type : 'nft',
        // descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix',
        minConfidence: 0.8,
    })

    markerControls = new THREEx.ArMarkerControls(arToolkitContext, camera, {
        type : 'unknown',
        patternUrl : './image/pattern-cm2.patt',
        // type : 'nft',
        // descriptorsUrl : './resources/images/klee/klee',
        changeMatrixMode: 'cameraTransformMatrix',
        minConfidence: 0.8,
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

            console.log(intersects);

            if (intersects.length > 0) {
                if (intersects[0].object.interactive == true && intersects[0].object.visible == true){
                    window.location.href = intersects[0].object.url; // Replace with your target URL
                    

                }
            }
    
            
        }
    }
}

function initObject() {
    //// Set object
    const geometry = new THREE.BoxGeometry( 0.3,0.3,0.3);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh = new THREE.Mesh( geometry, material );
    mesh.interactive = true;
    mesh.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328880?h=06de0d99e6')
    mesh.position.set(0, -0.5, 0);

    const material2 = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh2 = new THREE.Mesh( geometry, material2 );
    mesh2.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328899?h=1a18cdd048');
    mesh2.interactive = true;
    mesh2.position.set(0,-0.5,0.5);

    const material3 = new THREE.MeshPhongMaterial({
        color: 0x0000ff,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh3 = new THREE.Mesh( geometry, material3 );
    mesh3.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328787?h=3733b78225');
    mesh3.interactive = true;
    mesh3.position.set(0.0,0,0);

    const material4 = new THREE.MeshPhongMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh4 = new THREE.Mesh( geometry, material4 );
    mesh4.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328829?h=f97ae1becb');
    mesh4.interactive = true;
    mesh4.position.set(0.0,0,0.5);

    const material5 = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh5 = new THREE.Mesh( geometry, material5 );
    mesh5.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328847?h=4286ee4002');
    mesh5.interactive = true;
    mesh5.position.set(0.0,0.5,0);

    const material6 = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights
    });
    mesh6 = new THREE.Mesh( geometry, material6 );
    mesh6.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328863?h=35d8d875d3');
    mesh6.interactive = true;
    mesh6.position.set(0.0,0.5,0.5);

    
    // mesh.position.y = geometry.parameters.height / 2 ;
    // mesh.visible = true;
    scene.add(mesh);
    scene.add(mesh2);
    scene.add(mesh3);
    scene.add(mesh4);
    scene.add(mesh5);
    scene.add(mesh6);
    // camera.add(mesh);
}