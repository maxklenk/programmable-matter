var myMatter = (function() {

  var myMatter = {
    // virtual mouse
    mouseDownEvent: mouseDownEvent,
    mouseMoveEvent: mouseMoveEvent,
    mouseUpEvent: mouseUpEvent,

    // render
    togglePlay: togglePlay,

    // add bodies
    addRandomRectangle: addRandomRectangle,
    addRectangle: addRectangle,
    addCircle: addCircle,

    // edit bodies
    setStaticOfBody: setStaticOfBody,
    setAngleOfBody: setAngleOfBody,
    setScaleOfBody: setScaleOfBody,
    removeBodyAt: removeBodyAt,

    // state
    state: {
      isDragging: false,
      playMode: true,
      multipleBodiesMode: false
    },

    // matter
    engine: null,
    render: null,
    world: null,
    mouse: null
  };

  // internals
  var draggedBody = null;
  var startPoint = null;
  var startTimestamp = null;

  // Matter.js module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    Mouse = Matter.Mouse;

  init();

  ////////////

  function init() {
    // create a Matter.js engine
    myMatter.engine = Engine.create();
    myMatter.world = myMatter.engine.world;

    myMatter.render = Render.create({
      element: document.getElementById('canvas-container'),
      engine: myMatter.engine
    });

    // setup
    createDefaultBodies();
    createVirtualMouse();

    // run the engine
    Engine.run(myMatter.engine);

    // run the renderer
    Render.run(myMatter.render);

    // play mode
    togglePlay();
  }

  function createDefaultBodies() {
    // create bodies
    var stack = Composites.stack(250, 255, 1, 6, 0, 0, function(x, y) {
      var body = Bodies.rectangle(x, y, 30, 30);
      body.isMoveable = true;
      return body;
    });

    var catapult = Bodies.rectangle(400, 520, 320, 20, {});
    catapult.isMoveable = true;
    var catapult_stand_left = Constraint.create({bodyA: catapult, pointB: {x: 390, y: 580}});
    var catapult_stand_right = Constraint.create({bodyA: catapult, pointB: {x: 410, y: 580}});
    var holder = Bodies.rectangle(250, 555, 20, 50, {isStatic: true});

    var ball = Bodies.circle(560, 100, 50, {density: 0.005});
    ball.isMoveable = true;
    var ground = Bodies.rectangle(400, 610, 810, 60, {isStatic: true});

    var elements = [
      stack,
      catapult,
      catapult_stand_left,
      catapult_stand_right,
      holder,
      ball,
      ground
    ];

    // add all of the bodies to the world
    World.add(myMatter.world, elements);
  }

  // add mouse control
  function createVirtualMouse() {
    myMatter.mouse = Mouse.create(myMatter.render.canvas);
    var MouseConstraint = Matter.MouseConstraint;
    var mouseConstraint = MouseConstraint.create(myMatter.engine, {
      element: myMatter.render.canvas,
      mouse: myMatter.mouse
    });
    World.add(myMatter.world, mouseConstraint);
  }

  // pause movement of all elements
  function togglePlay() {
    myMatter.state.playMode = !myMatter.state.playMode;

    var allBodies = Matter.Composite.allBodies(myMatter.world);
    for (var i in allBodies) {
      if (allBodies[i].isMoveable) {
        allBodies[i].isStatic = !myMatter.state.playMode;
      }
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
    newRectangle.isMoveable = true;
    if (!myMatter.state.playMode) {
      newRectangle.isStatic = true;
    }
    World.add(myMatter.world, newRectangle);
  }

  function addCircle(x, y, radius, options) {
    var newCircle = Bodies.circle(x, y, radius, options);
    newCircle.isMoveable = true;
    if (!myMatter.state.playMode) {
      newCircle.isStatic = true;
    }
    World.add(myMatter.world, newCircle);
  }

  // pass events to virtual mouse
  function mouseDownEvent(event) {
    var element = elementOnPoint({x: event.layerX, y: event.layerY});
    if (element) {
      draggedBody = element.bodies[element.index];
      draggedBody.isStatic = false;
      myMatter.state.isDragging = true;
      startPoint = new Point(event.layerX, event.layerY);
      startTimestamp = Date.now();
    }

    myMatter.mouse.mousedown(event);
  }

  function mouseMoveEvent(event) {
    if (myMatter.state.isDragging) {
      myMatter.mouse.mousemove(event);
    }
  }

  function mouseUpEvent(event) {
    if (myMatter.state.isDragging) {
      var endTimestamp = Date.now();
      if (endTimestamp - startTimestamp < 200) {
        showMenu(startPoint, draggedBody);
      }
      startPoint = undefined;
      startTimestamp = undefined;

      if (!myMatter.state.playMode || !draggedBody.isMoveable) {
        draggedBody.isStatic = true;
      }
      myMatter.state.isDragging = false;
      draggedBody = null;
    }
    myMatter.mouse.mouseup(event);
  }

  function removeBodyAt(point) {
    var found = bodyOnPoint(point);
    if (found) {
      Matter.Composite.remove(myMatter.world, found, true);
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
    var bodies = myMatter.world.bodies;
    var found = elementOfBodiesOnPoint(bodies, point);
    if (found) {
      return found;
    }

    for (var i = 0; i < myMatter.world.composites.length; i++) {
      bodies = myMatter.world.composites[i].bodies;
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

  function setStaticOfBody(body, isStatic) {
    if (isStatic) {
      body.isMoveable = false;
      body.isStatic = true;
    } else {
      body.isMoveable = true;
      if (!myMatter.state.playMode) {
        body.isStatic = true;
      }
    }
  }

  function setAngleOfBody(body, angle) {
    Matter.Body.setAngle(body, angle);
  }

  function setScaleOfBody(body, scaleX, scaleY) {
    Matter.Body.scale(body, scaleX, scaleY);
  }

  return myMatter;

})();
