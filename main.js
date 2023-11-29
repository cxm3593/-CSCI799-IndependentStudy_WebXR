import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let camera, scene, renderer, mesh, mesh2, mesh3, mesh4, mesh5, mesh6, textMesh;
let controller;
let arToolkitContext, arToolkitSource, markerControls;
let pointCloud;
let asteroids = [];
let clock;
let light;

let group;

init();
initObject();
initARJS();
initInteractiveControl();
SetOverlays();
// PostProcessing();
sceneSetUp();
setButtons();
animate();


function init() {

    

    clock = new THREE.Clock();

    const container = document.createElement( 'div' );
    document.body.appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera();
    scene.add(camera);
    

    group = new THREE.Group();
    scene.add(group);

    //

    renderer = new THREE.WebGLRenderer( {
        antialias: true, 
        alpha: true,
    } );
    //renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );
    renderer.domElement.requestFullscreen();

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



function render() {
    var delta_time = clock.getDelta();

    arToolkitContext.update(arToolkitSource.domElement);
    scene.visible = camera.visible;
    pointCloud.rotation.x -= 0.1 * delta_time;
    pointCloud.rotation.z -= 0.1 * delta_time;

    if(textMesh){
        light.target.position.set(textMesh.position);
    }
    
    updateTextOverlay(mesh, "textOverlay1");
    updateTextOverlay(mesh2, "textOverlay2");
    updateTextOverlay(mesh3, "textOverlay3");
    updateTextOverlay(mesh4, "textOverlay4");
    updateTextOverlay(mesh5, "textOverlay5");
    updateTextOverlay(mesh6, "textOverlay6");
    // console.log("Camera:", camera.position, camera.visible);
    // console.log("Mesh:", mesh.position, mesh.visible);
    group.quaternion.copy(camera.quaternion);
    updateAsteroids(delta_time, 0.5);
    renderer.render( scene, camera );

}

function initARJS() {
    //// arToolkitSource ////
    arToolkitSource = new THREEx.ArToolkitSource({
        sourceType : 'webcam',
        sourceWidth: 1920,
        sourceHeight: 1080,
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
        // console.log('Marker found!', ev);
        
        var distance = camera.position.distanceTo(new THREE.Vector3(0,0,0));
        // console.log("Camera pos:", distance);
        var scale_factor = distance * 0.5;
        group.scale.set(scale_factor, scale_factor, scale_factor);
        document.getElementById('overlay').style.display = 'block';
        light.intensity = 10 * distance;
        
    });

    window.addEventListener('markerLost', function(ev){
        // console.log(camera.visible);
        camera.visible = true;
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
        side: THREE.DoubleSide,
        depthTest : false,
    });
    mesh = new THREE.Mesh( geometry, material );
    mesh.interactive = true;
    mesh.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328880?h=06de0d99e6');
    mesh.position.set(0, -0.5, 0);

    const material2 = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        shininess: 30, // Adjust shininess
        specular: 0x111111, // Color of specular highlights,
        side: THREE.DoubleSide,
        depthTest : false,
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
        specular: 0x111111, // Color of specular highlights,
        side: THREE.DoubleSide,
        depthTest : false,
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
        specular: 0x111111, // Color of specular highlights,
        side: THREE.DoubleSide,
        depthTest : false,
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
        specular: 0x111111, // Color of specular highlights,
        side: THREE.DoubleSide,
        depthTest : false,
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
        specular: 0x111111, // Color of specular highlights,
        side: THREE.DoubleSide,
        depthTest : false,
    });
    mesh6 = new THREE.Mesh( geometry, material6 );
    mesh6.url = 'video_page.html?videoUrl=' + encodeURIComponent('https://player.vimeo.com/video/888328863?h=35d8d875d3');
    mesh6.interactive = true;
    mesh6.position.set(0.0,0.5,0.5);

    
    // mesh.position.y = geometry.parameters.height / 2 ;
    // mesh.visible = true;
    var group2 = new THREE.Group();
    group2.rotateY(-90 * Math.PI / 180);
    group2.scale.set(0.7, 0.7, 0.7);
    group2.position.set(0.25, -0.5, 0);
    
    group2.add(mesh);
    group2.add(mesh2);
    group2.add(mesh3);
    group2.add(mesh4);
    group2.add(mesh5);
    group2.add(mesh6);

    group.add(group2);
    // camera.add(mesh);

    // Add thumbnails
    async function requestThumbNail(video_id) {
        const accessToken = "6db2c1db799b3defc219655861778459";
        try {
            const response = await fetch(`https://api.vimeo.com/videos/${video_id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log(data);
            const thumbnailUrl = data.pictures.sizes[3].link;
            console.log(thumbnailUrl);
            return thumbnailUrl;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async function loadThumbnailAndCreatePlane(video_id, mesh, index) {
        // const thumbnailUrl = await requestThumbNail(video_id);
        // if (thumbnailUrl) {
        //     const textureLoader = new THREE.TextureLoader();
        //     const thumbnailTexture = textureLoader.load(thumbnailUrl);
        // }
        const textureLoader = new THREE.TextureLoader();
        const thumbnailTexture = textureLoader.load("image/thumbnail" + String(index) + ".webp");
        const planeMaterial = new THREE.MeshBasicMaterial({
            map: thumbnailTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const planeGeometry = new THREE.PlaneGeometry(0.3, 0.3);
        const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.position.set(0.01, 0, 0);
        // Rotate the plane
        const rotationInRadians = 90 * Math.PI / 180;
        planeMesh.rotation.x = rotationInRadians;
        planeMesh.rotation.y = rotationInRadians;
        mesh.add(planeMesh);
    }
    

    loadThumbnailAndCreatePlane("888328880", mesh, 1);
    loadThumbnailAndCreatePlane("888328899", mesh2, 2);
    loadThumbnailAndCreatePlane("888328787", mesh3, 3);
    loadThumbnailAndCreatePlane("888328829", mesh4, 4);
    loadThumbnailAndCreatePlane("888328847", mesh5, 5);
    loadThumbnailAndCreatePlane("888328863", mesh6, 6);

    


}

function sceneSetUp(){
    //// Env ////
    scene.fog = new THREE.Fog( 0x000000, 250, 1400 );
    light = new THREE.DirectionalLight( 0xffffff, 1);
    light.position.set(0, 3, 3);
    group.add( light );
    

    //// Star cloud ////
    var ww = window.innerWidth,
    wh = window.innerHeight;
    var points = [];
    var cloud_material = new THREE.PointsMaterial({
        color: 0xffffff,
        size:1,
    });

    var cloud_geometry = new THREE.BufferGeometry();
    var x, y, z;

    for (var i = 0; i < 2000; i++) {
        x = (Math.random() * ww * 2) - ww;
        y = (Math.random() * wh * 2) - wh;
        z = (Math.random() * 5000) - 2500;
        
        // Add the point as a flat array
        points.push(x, y, z);
    }

    // Create a new Float32Array and use it as the 'position' attribute
    cloud_geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

    pointCloud = new THREE.Points(cloud_geometry, cloud_material);
    group.add(pointCloud);

    //// Asteroid ////
    
    
    for (let i=0; i<7;i++){
        let geometry = new THREE.DodecahedronGeometry(0.15, 1);
        //let geometry = new THREE.Sphere(0.15);
        // const positions = geometry.attributes.position;
        // const vertex = new THREE.Vector3();
        // const displacement = 0.02; // Set a small displacement value

        // for (let i = 0; i < positions.count; i++) {
        //     vertex.fromBufferAttribute(positions, i);

        //     // Apply a small random displacement
        //     vertex.x += (Math.random() - 0.5) * displacement;
        //     vertex.y += (Math.random() - 0.5) * displacement;
        //     vertex.z += (Math.random() - 0.5) * displacement;

        //     positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        // }

        // geometry.attributes.position.needsUpdate = true;

        const color = new THREE.Color(Math.random() * 0.5, Math.random() * 0.6, Math.random() * 0.5);
        //const color = new THREE.Color(1.0, 0.0, 0.0);
        const asteroid_mat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 1
        });
        const asteroid = new THREE.Mesh(geometry, asteroid_mat);
        var x = (Math.random() - 0.5) * 2;
        var y = (Math.random() - 0.5) * 2;
        var z = (Math.random() ) * -5;
        asteroid.position.copy(new THREE.Vector3(x, y,z));
        group.add(asteroid);
        asteroids.push(asteroid);
    }

    //// 3D font ////
    const loader = new FontLoader();
    
    loader.load('resources/fonts/helvetiker_bold.typeface.json', function (font) {
        const textGeometry = new TextGeometry('Astrodance', {
            font: font,
            size: 0.1,
            height: 0.2
        });

        const text_mat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, // Adjust color
            metalness: 0.6, // Value between 0 and 1
            roughness: 0.2  // Lower for smoother surfaces
        });
        textMesh = new THREE.Mesh(textGeometry, text_mat);
        textMesh.position.x = -0.25;
        group.add(textMesh);
    });
}

function updateAsteroids(delta_time, scale){
    asteroids.forEach(element => {
        element.position.x += (Math.random() - 0.5) * delta_time * scale;
        element.position.y += (Math.random() - 0.5) * delta_time * scale;
        element.position.z += (Math.random() - 0.5) * delta_time * scale;
    });
}

function setButtons(){
    // Select all buttons with the data-url attribute
    const buttons = document.querySelectorAll('button[data-url]');

    // Add a click event listener to each button
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Retrieve the URL from the data-url attribute
            const url = 'video_page.html?videoUrl=' + encodeURIComponent(this.getAttribute('data-url'));

            // Redirect to the URL
            window.location.href = url;
        });
    });
}

//// Add text overlay
function addTextOverlay(text, x, y, text_name) {
    const textDiv = document.createElement('div');
    textDiv.id = text_name;
    textDiv.style.position = 'absolute';
    textDiv.style.color = 'white'; // Change as needed
    textDiv.innerHTML = text;

    document.getElementById('overlay').appendChild(textDiv);
}

function updateTextOverlay(mesh, text_name) {
    const vector = new THREE.Vector3();
    mesh.updateWorldMatrix(true, false);
    mesh.getWorldPosition(vector);
    vector.project(camera);

    //const x = (vector.x *  .5 + .5) * renderer.domElement.clientWidth;
    const x = (vector.x *  .5 + 0.18) * renderer.domElement.clientWidth;
    const y = (vector.y *  -.5 + 0.5) * renderer.domElement.clientHeight;
    // console.log(x, y);

    const textOverlay = document.getElementById(text_name);
    textOverlay.style.left = `${x}px`;
    textOverlay.style.top = `${y}px`;
    textOverlay.style.display = 'block'; // Show the text
}

function SetOverlays(){
    addTextOverlay("Video 1", -1, -1, "textOverlay1");
    addTextOverlay("Video 2", -1, -1, "textOverlay2");
    addTextOverlay("Video 3", -1, -1, "textOverlay3");
    addTextOverlay("Video 4", -1, -1, "textOverlay4");
    addTextOverlay("Video 5", -1, -1, "textOverlay5");
    addTextOverlay("Video 6", -1, -1, "textOverlay6");

    const textDiv = document.createElement('div');
    textDiv.id = "Hint";
    textDiv.style.position = 'absolute';
    textDiv.style.bottom = '50%';
    textDiv.style.left = '50%';
    textDiv.style.transform = 'translateX(-50%)';
    textDiv.style.color = 'white'; // Change as needed
    textDiv.innerHTML = "Scan the marker";

    document.getElementById('overlay').appendChild(textDiv);
}

function PostProcessing(){
    const composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    composer.addPass(bloomPass);

    // In your render loop, replace renderer.render(scene, camera) with:
    composer.render();
}

function animate() {
    renderer.setAnimationLoop( render );

}