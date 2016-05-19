
  // Matter.js module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint;

  // create a Matter.js engine
  var engine = Engine.create(),
    world = engine.world;

  var render = Render.create({
    element: document.getElementById('canvas-container'),
    engine: engine
  });

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

  // add mouse control
  var Mouse = Matter.Mouse;
  var mouse = Mouse.create(render.canvas);
  var MouseConstraint = Matter.MouseConstraint;
  var mouseConstraint = MouseConstraint.create(engine, {
    element: render.canvas,
    mouse: mouse
  });
  World.add(world, mouseConstraint);

  // run the engine
  Engine.run(engine);

  // run the renderer
  Render.run(render);

  // play mode
  var playMode = true;
  togglePlay();

  // pause movement of all elements
  function togglePlay() {
    playMode = !playMode;

    for (var i in moveables) {
      moveables[i].isStatic = !playMode;
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
    if (!playMode) {
      newRectangle.isStatic = true;
    }
    World.add(world, newRectangle);
  }

  function addCircle(x, y, radius, options) {
    var newCircle = Bodies.circle(x, y, radius, options);
    moveables.push(newCircle);
    if (!playMode) {
      newCircle.isStatic = true;
    }
    World.add(world, newCircle);
  }

  var isDragging = false;
  var draggedBody = null;
  var startPoint = null;
  var startTimestamp = null;

  // pass events to virtual mouse
  function matterMouseDownEvent(event) {
    var element = elementOnPoint({x: event.layerX, y: event.layerY});
    if (element) {
      draggedBody = element.bodies[element.index];
      draggedBody.isStatic = false;
      isDragging = true;
      startPoint = new Point(event.layerX, event.layerY);
      startTimestamp = Date.now();
    }

    mouse.mousedown(event);
  }

  function matterMouseMoveEvent(event) {
    if (isDragging) {
      mouse.mousemove(event);
    }
  }

  function matterMouseUpEvent(event) {
    if (isDragging) {
      var endTimestamp = Date.now();
      if (endTimestamp - startTimestamp < 100) {
        console.log("click on element detected!");
      }
      showMenu(startPoint);
      startPoint = undefined;
      startTimestamp = undefined;


      if (!playMode) {
        draggedBody.isStatic = true;
      }
      isDragging = false;
      draggedBody = null;
    }
    mouse.mouseup(event);
  }

  function removeBodyAt(point) {
    var found = bodyOnPoint(point);
    if (found) {
      Matter.Composite.remove(world, found, true);
      return true;
    } else {
      return false;
    }

    //TODO: Constrains
  }

  function bodyOnPoint(point) {
    var result = elementOnPoint(point);
    if (result) {
      return result.bodies[result.index];
    }
    return false;
  }

  function elementOnPoint(point) {
    var bodies = world.bodies;
    var found = elementOfBodiesOnPoint(bodies, point);
    if (found) {
      return found;
    }

    for (var i = 0; i < world.composites.length; i++) {
      bodies = world.composites[i].bodies;
      return elementOfBodiesOnPoint(bodies, point);
    }
  }

  function elementOfBodiesOnPoint(bodies, point) {
    for (var i = 0; i < bodies.length; i++) {
      if (Matter.Bounds.contains(bodies[i].bounds, point)) {
        return {
          bodies: bodies,
          index: i
        };
      }
    }
    return false;
  }
