(function() {

  // Matter.js module aliases
  var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint;

  // create a Matter.js engine
  var engine = Engine.create(document.getElementById('canvas-container')),
    world = engine.world;

  // create bodies
  var stack = Composites.stack(250, 255, 1, 6, 0, 0, function(x, y) {
    return Bodies.rectangle(x, y, 30, 30);
  });

  var catapult = Bodies.rectangle(400, 520, 320, 20, {  });
  var catapult_stand_left =  Constraint.create({ bodyA: catapult, pointB: { x: 390, y: 580 } });
  var catapult_stand_right  = Constraint.create({ bodyA: catapult, pointB: { x: 410, y: 580 } });
  var holder = Bodies.rectangle(250, 555, 20, 50, { isStatic: true });

  var ball = Bodies.circle(560, 100, 50, { density: 0.005 });
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });


  // add all of the bodies to the world
  World.add(world, [
    stack,
    catapult,
    catapult_stand_left,
    catapult_stand_right,
    holder,
    ball,
    ground
  ]);


  // run the engine
  Engine.run(engine);

})();
