window.onload = setup;

// globals
var canvas; // the canvas element
var engine; // the BABYLON 3D engine
var scene;
var textures = [];
var camera;
var vehicles = [];
var numVehicles = 100;
var frameCount;

// a virtual box within which the vehicles will be contained
// centered around 0,0,0
var world = {   // bounds within which the vehicles should stay
    right: 16,
    top: 12,
    back: 8
};
world.left = -world.right;
world.bottom = -world.top;
world.front = -world.back;


function setup() {
    canvas = document.getElementById("renderCanvas"); // Get the canvas element
    engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
    // Create the scene space
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0,0,0,1);
    textures = [];

    // Add a camera to the scene and attach it to the canvas
    // var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0,0,5), scene);
    camera = new BABYLON.UniversalCamera("UniCamera", new BABYLON.Vector3(0, 0, -30), scene);
    camera.attachControl(canvas, true);

    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

    init();
    }
// Create the flocking vehicles and start the animation
function init() {
    Vehicle.createMaterials(scene);
    // Create all the vehicles
    for(let i = 0; i < numVehicles; i++)
        vehicles.push(new Vehicle(i));
    // measure performance
    frameCount = 0;
    setInterval (function() {
        //console.log(frameCount /3 + " FPS");
        frameCount = 0;
    }, 3000);

    engine.runRenderLoop(function () {
        animate();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });

}

function animate(){
    frameCount++;   // could not get PerformanceMonitor to work
    for(let i = 0; i < vehicles.length; i++)
        vehicles[i].update();
    scene.render();
}
