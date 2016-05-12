
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
  var moveables = [];
  var stack = Composites.stack(250, 255, 1, 6, 0, 0, function(x, y) {
    var body = Bodies.rectangle(x, y, 30, 30);
    moveables.push(body);
    return body;
  });

  var catapult = Bodies.rectangle(400, 520, 320, 20, {  });
  var catapult_stand_left =  Constraint.create({ bodyA: catapult, pointB: { x: 390, y: 580 } });
  var catapult_stand_right  = Constraint.create({ bodyA: catapult, pointB: { x: 410, y: 580 } });
  var holder = Bodies.rectangle(250, 555, 20, 50, { isStatic: true });

  var ball = Bodies.circle(560, 100, 50, { density: 0.005 });
  var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

  var elements = [
    stack,
    catapult,
    catapult_stand_left,
    catapult_stand_right,
    holder,
    ball,
    ground
  ];
  moveables.push(ball);
  moveables.push(catapult);

  // add all of the bodies to the world
  World.add(world, elements);


  // run the engine
  Engine.run(engine);

  // interactive
  world.gravity.y = 0;

  // pause movement of all elements
  function togglePlay() {
    world.gravity.y = (world.gravity.y + 1) % 2;

    var isStatic = world.gravity.y === 0;
    for (var i in moveables) {
      moveables[i].isStatic = isStatic;
    }

    // This should do the trick, but it doesn't work
    // http://brm.io/matter-js/docs/#property_timing.timeScale
    // engine.timing.timeScale = 0;
  }

  function addRandomRectangle() {
    var x = rand(30, 790);
    addRectangle(x, 150, 40, 40);
  }

  function addRectangle(x, y, width, height, options) {
    var newRectangle = Bodies.rectangle(x, y, width, height, options);
    moveables.push(newRectangle);
    World.add(world, newRectangle);
  }
  
  function addCircle(x, y, width, height, options) {
    var newCircle = Bodies.circle(x, y, width, height, options);
    moveables.push(newCircle);
    World.add(world, newCircle);
  }
