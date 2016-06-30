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
    myLevels.addFourWalls();
  }

  function catapult() {
    myLevels.clearWorld();

    var stack = Matter.Composites.stack(250, 255, 1, 6, 0, 0, function(x, y) {
      var body = Matter.Bodies.rectangle(x, y, 30, 30);
      body.isMoveable = true;
      return body;
    });

    var catapult = Matter.Bodies.rectangle(400, 520, 320, 20, {});
    catapult.isMoveable = true;
    var catapult_stand_left = Matter.Constraint.create({bodyA: catapult, pointB: {x: 390, y: 580}});
    var catapult_stand_right = Matter.Constraint.create({bodyA: catapult, pointB: {x: 410, y: 580}});
    var holder = Matter.Bodies.rectangle(250, 555, 20, 50, {isStatic: true});

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

  function addFourWalls() {
    myLevels.addLeftWall();
    myLevels.addRightWall();
    myLevels.addGround();
    myLevels.addCeiling();
  }

  function addLeftWall() {
    var wall_left = Matter.Bodies.rectangle(0, 0, 100, 1260, {isStatic: true});
    wall_left.render.fillStyle = '#222222';
    Matter.World.add(myMatter.world, wall_left);
  }

  function addRightWall() {
    var wall_right = Matter.Bodies.rectangle(800, 0, 100, 1260, {isStatic: true});
    wall_right.render.fillStyle = '#222222';
    Matter.World.add(myMatter.world, wall_right);
  }

  function addGround() {
    var ground = Matter.Bodies.rectangle(400, 610, 810, 60.5, {isStatic: true});
    ground.render.fillStyle = '#222222';
    Matter.World.add(myMatter.world, ground);
  }

  function addCeiling() {
    var ceiling = Matter.Bodies.rectangle(400, 0, 810, 60.5, {isStatic: true});
    ceiling.render.fillStyle = '#222222';
    Matter.World.add(myMatter.world, ceiling);
  }


  return myLevels;

})();
