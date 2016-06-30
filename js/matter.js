'use strict';

var myMatter = (function() {

  var myMatter = {
    // virtual mouse
    mouseDownEvent: mouseDownEvent,
    mouseMoveEvent: mouseMoveEvent,
    mouseUpEvent: mouseUpEvent,

    // render
    togglePlay: togglePlay,

    // add bodies
    addRectangle: addRectangle,
    addCircle: addCircle,
    addVector: addVector,
    addLine: addLine,
    addCompound: addCompound,

    // create bodies
    getRectangle: getRectangle,
    getCircle: getCircle,

    // edit bodies
    setStaticOfBody: setStaticOfBody,
    setAngleOfBody: setAngleOfBody,
    setScaleOfBody: setScaleOfBody,
    setDensityOfBody: setDensityOfBody,
    removeBodyAt: removeBodyAt,

    // vector canvas
    clearVectors: clearVectors,
    drawArrow: drawArrow,

    // state
    state: {
      isHandling: false,
      isDragging: false,
      playMode: true,
      multipleBodiesMode: false,
      selectedBody: null,
      enablePreview: true
    },

    // matter
    engine: null,
    render: null,
    world: null,
    mouse: null,
    mouseConstraint: null
  };

  // constants
  var CLICK_DELAY_MS = 200;

  // internals
  var draggedBody = null;
  var startPoint = null;
  var startTimestamp = null;
  var arrows = []; // each element: {from: point, to: point, colorString: colorString}
  var resultingArrows = []; // each element: {bodyId: id, from: point, to: point}

  // internals: preview animation
  var NO_MOVE_DIST = 2;
  var NO_ANIMATION_MS = 600;
  var lastDragPoint = null;
  var lastAnimationTimestamp = 0;

  // Matter.js module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Composites = Matter.Composites,
    Constraint = Matter.Constraint,
    MouseConstraint = Matter.MouseConstraint,
    Mouse = Matter.Mouse,
    Body = Matter.Body;
  var resurrect = new Resurrect({ cleanup: true, revive: false });

  init();

  ////////////

  function init() {
    // create a Matter.js engine
    myMatter.engine = Engine.create();
    myMatter.world = myMatter.engine.world;

    myMatter.render = Render.create({
      element: document.getElementById('canvas-container'),
      canvas: document.getElementById('mainAnimation'),
      engine: myMatter.engine
    });

    // setup
    createDefaultBodies();
    createVirtualMouse(myMatter);

    // setTimeout(function() {
    //     myLevels.catapult()
    // }, 300);
    setRenderOptions();

    myMatter.vectorCanvas = document.getElementById('vectorCanvas');
    // run the engine
    Engine.run(myMatter.engine);

    // run the renderer
    Render.run(myMatter.render);

  }

  function drawArrows() {
      var context = myMatter.vectorCanvas.getContext("2d");
      clearVectors();
      for (var i = 0; i < arrows.length; i++) {
          drawArrow(arrows[i].from, arrows[i].to, arrows[i].colorString, context);
      }
      for (var i = 0; i < resultingArrows.length; i++) {
          drawArrow(resultingArrows[i].from, resultingArrows[i].to, resultingArrows[i].colorString, context);
      }
  }

  function drawArrow(from, to, colorString, context) {
      var headlen = 10;
      var angle = Math.atan2(toy-fromy,tox-fromx);
      var fromx = from.x;
      var fromy = from.y;
      var tox = to.x;
      var toy = to.y;
      var headlen = 15;

      var angle = Math.atan2(toy-fromy,tox-fromx);

      //starting path of the arrow from the start square to the end square and drawing the stroke
      context.beginPath();
      context.moveTo(fromx, fromy);
      context.lineTo(tox, toy);
      context.strokeStyle = colorString;
      context.lineWidth = 2;
      context.stroke();

      //starting a new path from the head of the arrow to one of the sides of the point
      context.beginPath();
      context.moveTo(tox, toy);
      context.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

      //path from the side point of the arrow, to the other side point
      context.lineTo(tox-headlen*Math.cos(angle+Math.PI/7),toy-headlen*Math.sin(angle+Math.PI/7));

      //path from the side point back to the tip of the arrow, and then again to the opposite side point
      context.lineTo(tox, toy);
      context.lineTo(tox-headlen*Math.cos(angle-Math.PI/7),toy-headlen*Math.sin(angle-Math.PI/7));

      //draws the paths created above
      context.strokeStyle = colorString;
      context.lineWidth = 2;
      context.stroke();
      context.fillStyle = colorString;
      context.fill();
  }

  function clearVectors() {
      var context = myMatter.vectorCanvas.getContext("2d");
      context.clearRect(0, 0, myMatter.vectorCanvas.width, myMatter.vectorCanvas.height);
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

    var ground = Bodies.rectangle(400, 610, 810, 60.5, {isStatic: true});
    ground.render.fillStyle = 'transparent';
    var wall_left = Bodies.rectangle(0, 0, 100, 1260, {isStatic: true});
    wall_left.render.fillStyle = 'transparent';
    var wall_right = Bodies.rectangle(800, 0, 100, 1260, {isStatic: true});
    wall_right.render.fillStyle = 'transparent';
    var ceiling = Bodies.rectangle(400, 0, 810, 60.5, {isStatic: true});
    ceiling.render.fillStyle = 'transparent';

    var elements = [
      stack,
      catapult,
      catapult_stand_left,
      catapult_stand_right,
      holder,
      ball,
      ground,
      wall_left,
      wall_right,
      ceiling
    ];

    // add all of the bodies to the world
    World.add(myMatter.world, elements);
  }

  // add mouse control
  function createVirtualMouse(matter) {
    matter.mouse = Mouse.create(matter.render.canvas);
    matter.mouseConstraint = MouseConstraint.create(matter.engine, {
      element: matter.render.canvas,
      mouse: matter.mouse
    });
    matter.mouseConstraint.constraint.stiffness = 0.8; // keep body on cursor
    World.add(matter.world, matter.mouseConstraint);
  }

  function setRenderOptions() {
    var renderOptions = myMatter.render.options;
    renderOptions.wireframes = false;
    renderOptions.hasBounds = false;
    renderOptions.showDebug = false;
    renderOptions.showBroadphase = false;
    renderOptions.showBounds = false;
    renderOptions.showVelocity = false;
    renderOptions.showCollisions = false;
    renderOptions.showAxes = false;
    renderOptions.showPositions = false;
    renderOptions.showAngleIndicator = false;
    renderOptions.showIds = false;
    renderOptions.showShadows = false;
    renderOptions.showVertexNumbers = false;
    renderOptions.showConvexHulls = false;
    renderOptions.showInternalEdges = false;
    renderOptions.showSeparations = false;
    renderOptions.background = 'transparent';
  }

  // pause movement of all elements
  function togglePlay() {
    myMatter.state.playMode = !myMatter.state.playMode;

    var allBodies = Matter.Composite.allBodies(myMatter.world);
    for (var i in allBodies) {
      if (allBodies[i].isMoveable) {
        allBodies[i].isStatic = !myMatter.state.playMode;
        if (myMatter.state.playMode && allBodies[i].nextForce) {
            Matter.Body.applyForce(allBodies[i], allBodies[i].position, allBodies[i].nextForce);
            allBodies[i].nextForce = undefined;
        }
      }
    }
    if (myMatter.state.playMode) {
        myMatter.clearVectors();
        arrows = [];
        resultingArrows = [];
    }

    // This should do the trick, but it doesn't work
    // http://brm.io/matter-js/docs/#property_timing.timeScale
    // engine.timing.timeScale = 0;
  }

  function renderPreview() {

    // create a Matter.js engine
    var copyMatter = {};
    copyMatter.engine = Engine.create();
    copyMatter.engine.world = resurrect.resurrect(resurrect.stringify(myMatter.world));
    copyMatter.world = copyMatter.engine.world;

    copyMatter.render = Render.create({
      element: document.getElementById('canvas-container'),
      canvas: document.getElementById('previewAnimation'),
      engine: copyMatter.engine
    });

    // run the engine
    Engine.run(copyMatter.engine);

    // run the renderer
    Render.run(copyMatter.render);

    // add borders
    var ground = Bodies.rectangle(400, 610, 810, 60.5, {isStatic: true});
    ground.render.fillStyle = 'transparent';
    var wall_left = Bodies.rectangle(0, 0, 100, 1260, {isStatic: true});
    wall_left.render.fillStyle = 'transparent';
    var wall_right = Bodies.rectangle(800, 0, 100, 1260, {isStatic: true});
    wall_right.render.fillStyle = 'transparent';
    var ceiling = Bodies.rectangle(400, 0, 810, 60.5, {isStatic: true});
    ceiling.render.fillStyle = 'transparent';
    World.add(copyMatter.world, [
      ground,
      wall_left,
      wall_right,
      ceiling
    ]);

    // deactivate Mouse Constraints
    for (var j in copyMatter.world.constraints) {
      if (copyMatter.world.constraints[j].label === 'Mouse Constraint') {
        copyMatter.world.constraints[j].length = 0;
        copyMatter.world.constraints[j].stiffness = 0;
        copyMatter.world.constraints[j].render.visible = false;
      }
    }

    // activate bodies
    var allBodies = Matter.Composite.allBodies(copyMatter.world);
    for (var i in allBodies) {
      if (allBodies[i].isMoveable) {
        allBodies[i].isStatic = false;
      }
    }

    setTimeout(function() {
      Matter.World.clear(copyMatter.world, false);
    }, 2000)
  }

  function addRectangle(x, y, width, height, options) {
    var newRectangle = getRectangle(x, y, width, height, options);
    World.add(myMatter.world, newRectangle);
  }

  function getRectangle(x, y, width, height, options) {
    var newRectangle = Bodies.rectangle(x, y, width, height, options);
    newRectangle.isMoveable = true;
    if (!myMatter.state.playMode) {
      newRectangle.isStatic = true;
    }
    return newRectangle;
  }

  function addCircle(x, y, radius, options) {
    var newCircle = getCircle(x, y, radius, options);
    World.add(myMatter.world, newCircle);
  }

  function getCircle(x, y, radius, options) {
      var newCircle = Bodies.circle(x, y, radius, options);
      newCircle.isMoveable = true;
      if (!myMatter.state.playMode) {
        newCircle.isStatic = true;
      }
      return newCircle;
  }

  function addVector(arrow) {
    var body = myMatter.selectedBody;
    var position = body.position;
    var forceDivider = (40 / body.mass) * 50;
    var force = Matter.Vector.create(
        arrow.direction.x / forceDivider,
        arrow.direction.y / forceDivider
    );
    if (myMatter.state.playMode) {
        Matter.Body.applyForce(body, position, force);
    } else {
        if (body.nextForce) {
            var resultingForce = Matter.Vector.create(
                body.nextForce.x + force.x,
                body.nextForce.y + force.y
            )
            body.nextForce = resultingForce;
            var to = {
                x: position.x + resultingForce.x * forceDivider,
                y: position.y + resultingForce.y * forceDivider
            };
            addResultingArrow(position, to, body.id);
        } else {
            body.nextForce = force;
            console.log(body);
        }
        var endPosition = {
            x: position.x + arrow.direction.x,
            y: position.y + arrow.direction.y
        }
        arrows.push({
            from: position,
            to: endPosition,
            colorString: "#cc0000"
        });
        drawArrows();

    }
  }

  function addResultingArrow(from, to, id) {
      for (var i = 0; i < resultingArrows.length; i++) {
          if (resultingArrows[i].id === id) {
              resultingArrows.splice(i, 1);
              break;
          }
      }

      resultingArrows.push({
          from: from,
          to: to,
          colorString: "#00cc00",
          id: id
      })
  }

  function addLine(line) {
    var endPoint = {
      x: line.start.x + line.direction.x ,
      y: line.start.y + line.direction.y
    };
    var newArrow = Constraint.create({bodyA: myMatter.selectedBody, pointB: endPoint});
    World.add(myMatter.world, newArrow);
  }

  function addCompound(bodies) {
    if (bodies.length === 0) {
        return;
    }
    var compound = Body.create({
      parts: bodies
    });
    compound.isMoveable = true;
    if (!myMatter.state.playMode) {
      compound.isStatic = true;
    }
    World.add(myMatter.world, [compound]);
  }

  // pass events to virtual mouse
  function mouseDownEvent(event) {
    var element = elementOnPoint({x: event.layerX, y: event.layerY});

    // handle new body clicks
    if (element && myMatter.selectedBody != element.bodies[element.index]) {
      // start dragging
      draggedBody = element.bodies[element.index];
      myMatter.state.isHandling = true;

      // click Handler
      startPoint = new Point(event.layerX, event.layerY);
      startTimestamp = Date.now();
    }

    // reset selected element
    if (myMatter.selectedBody && (!element || myMatter.selectedBody != element.bodies[element.index]) && !myMatter.state.isDrawing) {
      myMatter.selectedBody.render.lineWidth = 1.5;
      myMatter.selectedBody.render.strokeStyle = Matter.Common.shadeColor( myMatter.selectedBody.render.fillStyle, -20);
      myMatter.selectedBody = null;
    }

    myMatter.mouse.mousedown(event);
  }

  function mouseMoveEvent(event) {
    var currentTimestamp = Date.now();

    if (myMatter.state.isHandling && !myMatter.state.isDragging) {
      // only move when not a click

      if (currentTimestamp - startTimestamp > CLICK_DELAY_MS) {
        myMatter.state.isDragging = true;
        draggedBody.isStatic = false;
      }
    }

    if (myMatter.state.isDragging) {
      myMatter.mouse.mousemove(event);
    }

    if (myMatter.state.isDragging && myMatter.state.enablePreview) {
      // check when to show preview animation
      var currentPoint = {
        X: event.layerX,
        Y: event.layerY
      };
      if (lastDragPoint) {
        var dist = Math.pow(lastDragPoint.X - currentPoint.X, 2) + Math.pow(lastDragPoint.Y - currentPoint.Y, 2);
        var timeDist = currentTimestamp - lastAnimationTimestamp;
        if (dist < NO_MOVE_DIST && timeDist > NO_ANIMATION_MS) {
          lastAnimationTimestamp = currentTimestamp;

          renderPreview();
        }
      }
      lastDragPoint = currentPoint;
    }
  }

  function mouseUpEvent(event) {
    if (myMatter.state.isHandling) {

      // click Handler
      var endTimestamp = Date.now();
      if (endTimestamp - startTimestamp < CLICK_DELAY_MS) {
        showMenu(startPoint, draggedBody);
        myMatter.selectedBody = draggedBody;
        myMatter.selectedBody.render.lineWidth = 3;
        myMatter.selectedBody.render.strokeStyle = Matter.Common.shadeColor( myMatter.selectedBody.render.fillStyle, +20);
      }
      startPoint = undefined;
      startTimestamp = undefined;

      // stop dragging
      if (!myMatter.state.playMode || !draggedBody.isMoveable) {
        draggedBody.isStatic = true;
      }
      myMatter.state.isDragging = false;
      draggedBody = null;
    }
    myMatter.state.isHandling = false;
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
      body.isStatic = false;
    }

    // render properties (http://brm.io/matter-js/docs/files/src_body_Body.js.html#l151)
    var newFillStyle = (!body.isMoveable ? '#eeeeee' : Matter.Common.choose(['#556270', '#4ECDC4', '#C7F464', '#FF6B6B', '#C44D58']));
    var newStrokeStyle = Matter.Common.shadeColor(newFillStyle, -20);
    body.render.fillStyle = newFillStyle;
    body.render.strokeStyle = newStrokeStyle;

    // play mode
    if (!myMatter.state.playMode) {
      body.isStatic = true;
    }
  }

  function setAngleOfBody(body, angle) {
    Matter.Body.setAngle(body, angle);
  }

  function setScaleOfBody(body, scaleX, scaleY) {
    Matter.Body.scale(body, scaleX, scaleY);
  }

  function setDensityOfBody(body, density) {
    Matter.Body.setDensity(body, density);
  }

  return myMatter;

})();
