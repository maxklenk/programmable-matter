'use strict';

var myLevels = (function() {

  var myLevels = {
    clearWorld: clearWorld,
    addFourWalls: addFourWalls,
    addLeftWall: addLeftWall,
    addRightWall: addRightWall,
    addGround: addGround,
    addCeiling: addCeiling,
    catapult: catapult
  };

  function clearWorld() {
    Matter.World.clear(myMatter.world, false);
    Matter.World.add(myMatter.world, myMatter.mouseConstraint);
    myLevels.addFourWalls(myMatter);
  }

  function catapult() {
    myLevels.clearWorld();

    var stack = Matter.Composites.stack(250, 255, 1, 6, 0, 0, function(x, y) {
      var body = Matter.Bodies.rectangle(x, y, 30, 30);
      body.isMoveable = true;
      return body;
    });

    var catapult = Matter.Bodies.rectangle(400, 540, 320, 20, {});
    catapult.isMoveable = true;
    var catapult_stand_left = Matter.Constraint.create({bodyA: catapult, pointB: {x: 390, y: 600}});
    var catapult_stand_right = Matter.Constraint.create({bodyA: catapult, pointB: {x: 410, y: 600}});
    var holder = Matter.Bodies.rectangle(250, 580, 20, 60, {isStatic: true});

    var ball = Matter.Bodies.circle(560, 100, 50, {density: 0.005});
    ball.isMoveable = true;

    var elements = [
      stack,
      catapult,
      catapult_stand_left,
      catapult_stand_right,
      holder,
      ball
    ];

    // add all of the bodies to the world
    Matter.World.add(myMatter.world, elements);
  }

  function addFourWalls(matter) {
    myLevels.addLeftWall(matter);
    myLevels.addRightWall(matter);
    myLevels.addGround(matter);
    myLevels.addCeiling(matter);
  }

  function addLeftWall(matter) {
    var wall_left = Matter.Bodies.rectangle(-51, 0, 100, 1260, {isStatic: true});
    Matter.World.add(matter.world, wall_left);
  }

  function addRightWall(matter) {
    var wall_right = Matter.Bodies.rectangle(851, 0, 100, 1260, {isStatic: true});
    Matter.World.add(matter.world, wall_right);
  }

  function addGround(matter) {
    var ground = Matter.Bodies.rectangle(400, 651, 900, 100, {isStatic: true});
    Matter.World.add(matter.world, ground);
  }

  function addCeiling(matter) {
    var ceiling = Matter.Bodies.rectangle(400, -51, 810, 100, {isStatic: true});
    Matter.World.add(matter.world, ceiling);
  }

  return myLevels;

})();
