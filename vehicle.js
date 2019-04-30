
// Vehicle is a cylinder shaped like a cone
function Vehicle(i) {
    this.mesh = BABYLON.MeshBuilder.CreateCylinder("vehicle"+i, { height: 1, diameterTop: 0, diameterBottom: 0.5 }, scene);
    this.mesh.material = Vehicle.materials[i%6];

    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.bakeCurrentTransformIntoVertices();

    // create a location that is randomly within the bounds of a world
    // that is centered on 0,0,0
    var x = Math.random() * (world.right-world.left) - world.right;
    var y = Math.random() * (world.top-world.bottom) - world.top;
    var z = Math.random() * (world.back-world.front) - world.back;
    this.mesh.position.set(x,y,z);


    this.vel = new BABYLON.Vector3((Math.random()*.2)-.1,
            (Math.random()*.2)-.1, (Math.random()*.2)-.1);
    this.limit(this.vel,Vehicle.maxSpeed);
    this.acc = new BABYLON.Vector3(0,0,0);
    }

// some factors to govern flocking
Vehicle.align_coh_dist_sq = 4*4;    // range for cohesion and alignment
Vehicle.sep_dist_sq = 1*1;          // range for separation
Vehicle.sep_factor = 6;             // force multipliers
Vehicle.coh_factor = 0.1;
Vehicle.align_factor = 0.1;
Vehicle.maxSpeed = 0.1;             // limits for speed and acceleration
Vehicle.maxAcc = 0.01;
Vehicle.createMaterials = function(scene) {
    let redmat = new BABYLON.StandardMaterial("red", scene);
    redmat.diffuseColor = new BABYLON.Color3(1,.5,.5);  // red
    let yellowmat = new BABYLON.StandardMaterial("yellow", scene);
    yellowmat.diffuseColor = new BABYLON.Color3(1,1,.5);  // yellow
    let greenmat = new BABYLON.StandardMaterial("green", scene);
    greenmat.diffuseColor = new BABYLON.Color3(.5,1,.5);  // green
    let cyanmat = new BABYLON.StandardMaterial("cyan", scene);
    cyanmat.diffuseColor = new BABYLON.Color3(.5,1,1);  // cyan
    let bluemat = new BABYLON.StandardMaterial("blue", scene);
    bluemat.diffuseColor = new BABYLON.Color3(.5,.5,1);  // blue
    let magentamat = new BABYLON.StandardMaterial("magenta", scene);
    magentamat.diffuseColor = new BABYLON.Color3(1,.5,1);  // magenta
    Vehicle.materials = [redmat,yellowmat,greenmat,cyanmat,bluemat,magentamat];
}


// update each vehicle's velocity, location, and rotation
Vehicle.prototype.update = function() {
    this.checkEdges();  // keep within world boundaries
    this.cohesion_alignment_separation();
    this.limit(this.acc, Vehicle.maxAcc);
    this.vel.addInPlace(this.acc);
    this.acc.set(0,0,0);
    this.limit(this.vel,Vehicle.maxSpeed);
    this.mesh.position.addInPlace(this.vel);
    // for rotation, have this vehicle look at a point projected
    // ahead of its location based on its velocity.
    var target = this.vel.normalizeToNew().scaleInPlace(2).addInPlace(this.mesh.position);
    this.mesh.lookAt(target);

}

Vehicle.prototype.applyForce = function(v) {
    this.acc.addInPlace(v);
}

// Vector3 should have but apparently does not have a limit method
// so do it here, limiting to a scalar the length of a vector
Vehicle.prototype.limit = function(v,s){
    if(v.lengthSquared() > (s*s)){
        v.normalize().scaleInPlace(s);
    }
}

// cohesion_alignment_separation() --
// compute and apply accelerations for cohesion, alignment and separation

Vehicle.prototype.cohesion_alignment_separation = function() {
    var sep = new BABYLON.Vector3(0,0,0);   // separation acceleration accumulator
    var coh = new BABYLON.Vector3(0,0,0);   // position accumulator for cohesion
    var align = new BABYLON.Vector3(0,0,0); // velocity accumulator for alignment
    var count = 0;

    for(let i = 0; i < vehicles.length; i++){
        let veh = vehicles[i];
        if(veh === this)
            continue;   // dont consider this vehicle
        let diff = this.mesh.position.subtract(veh.mesh.position);
        let diff_len_sq = diff.lengthSquared();
        if(diff_len_sq < Vehicle.align_coh_dist_sq){
            count++;
            coh.addInPlace(veh.mesh.position);
            align.addInPlace(veh.vel);
            // separation
            if(diff_len_sq < (Vehicle.sep_dist_sq)){
                sep.addInPlace(diff.scale(Vehicle.sep_factor));
            }
        }
    }
    if(count){  // if there were any nearby neighbors
        this.applyForce(sep);   // separation
        // cohesion
        coh.scaleInPlace(1/count);  // scalar divide
        // desired velocity for cohesion
        let desired = coh.subtract(this.mesh.position).normalize().scaleInPlace(Vehicle.maxSpeed);
        // cohesion steering
        this.applyForce(desired.subtract(this.vel).scaleInPlace(Vehicle.coh_factor));
        // alignment
        align.scaleInPlace(1/count); // scalar divide
        // desired velocity for alignment
        desired = align.normalize().scaleInPlace(Vehicle.maxSpeed);
        this.applyForce(desired.subtract(this.vel).scaleInPlace(Vehicle.align_factor));
    }

}

// checkEdges --
// Keep each vehicle within the confines of the world cube.
// When a vehicle gets close to one of the sides of the world cube,
// use the difference between the vehicles velocity and a vector
// towards the nearby side to steer the vehicle away from the nearby side.

Vehicle.prototype.checkEdges = function(){
    if((world.right - this.mesh.position.x)< 2) {
        // create a vector towards the right edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(1,0,0).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }
    if((this.mesh.position.x - world.left)< 2) {
        // create a vector towards the left edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(-1,0,0).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }
    if((this.mesh.position.y - world.bottom)< 1.5) {
        // create a vector towards the bottom edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(0,-1,0).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }
    if((world.top - this.mesh.position.y)< 1.5) {
        // create a vector towards the top edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(0,1,0).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }
    if((world.back - this.mesh.position.z)< 1) {
        // create a vector towards the back edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(0,0,1).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }
    if((this.mesh.position.z - world.front)< 1) {
        // create a vector towards the front edge the same length
        // as the current velocity
        var ref = new BABYLON.Vector3(0,0,-1).scaleInPlace(this.vel.length());
        var diff = this.vel.subtract(ref);
        this.applyForce(diff);
    }

}
