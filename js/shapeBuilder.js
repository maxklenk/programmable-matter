function ShapeBuilder() {
  function Point(x, y) // constructor
  {
    this.x = x;
    this.y = y;
  }

  function Rectangle(x, y, width, height) // constructor
  {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  function Circle(x, y, radius) // constructor
  {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }

  function Arrow(start, direction, magnitude)  // constructor
  {
    this.start = start;
    this.direction = direction;
    this.magnitude = magnitude;
  }

  function Line(start, end, direction) {
      this.start = start;
      this.end = end;
      this.direction = direction;
  }

  // Is currently bounding box; could be improved to be more precise
  this.getRectangle = function(strokes) {
    var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    for (var i = 0; i < strokes.length; i++) {
      minX = Math.min(minX, strokes[i].x);
      minY = Math.min(minY, strokes[i].y);
      maxX = Math.max(maxX, strokes[i].x);
      maxY = Math.max(maxY, strokes[i].y);
    }
    var centerX = minX + (maxX - minX) / 2;
    var centerY = minY + (maxY - minY) / 2;
    return new Rectangle(centerX, centerY, maxX - minX, maxY - minY);
  }

  this.getCircle = function(strokes) {
    var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    for (var i = 0; i < strokes.length; i++) {
      minX = Math.min(minX, strokes[i].x);
      minY = Math.min(minY, strokes[i].y);
      maxX = Math.max(maxX, strokes[i].x);
      maxY = Math.max(maxY, strokes[i].y);
    }
    var centerX = minX + (maxX - minX) / 2;
    var centerY = minY + (maxY - minY) / 2;
    var radius = ((maxX - minX) / 2 + (maxY - minY) / 2) / 2;
    return new Circle(centerX, centerY, radius);
  }

  this.getArrow = function(strokes) {
    if (strokes.length != 2) {
      return; // maybe later: get two longest strokes...
    }
    var deviation1 = getDeviation(strokes[0]);
    var deviation2 = getDeviation(strokes[1]);
    var directionPartIndex = deviation1 < deviation2 ? 0 : 1;
    var arrowPartIndex = deviation1 < deviation2 ? 1 : 0;

    var centerOfArrowPart = Math.floor(strokes[arrowPartIndex].length / 2);
    var distanceToArrowPart1 = Math.sqrt( Math.pow(strokes[directionPartIndex][0].x - strokes[arrowPartIndex][centerOfArrowPart].x, 2) + Math.pow(strokes[directionPartIndex][0].y - strokes[arrowPartIndex][centerOfArrowPart].y, 2));
    var distanceToArrowPart2 = Math.sqrt( Math.pow(strokes[directionPartIndex][strokes[directionPartIndex].length - 1].x - strokes[arrowPartIndex][centerOfArrowPart].x, 2) - Math.pow(strokes[directionPartIndex][strokes[directionPartIndex].length - 1].y - strokes[arrowPartIndex][centerOfArrowPart].y, 2));
    var start = distanceToArrowPart1 < distanceToArrowPart2 ? strokes[directionPartIndex][strokes[directionPartIndex].length - 1] : strokes[directionPartIndex][0];
    var end = distanceToArrowPart1 < distanceToArrowPart2 ? strokes[directionPartIndex][0] : strokes[directionPartIndex][strokes[directionPartIndex].length - 1];

    var direction = new Point(end.x - start.x, end.y - start.y);
    var magnitude = Math.sqrt(Math.pow(direction.x, 2), Math.pow(direction.y, 2));
    return new Arrow(start, direction, magnitude);
  }

  this.getLine = function(strokes) {
      if (strokes.length != 1) {
          return;
      }
      var start = strokes[0][0];
      var end = strokes[0][strokes[0].length - 1];
      var direction = new Point(end.x - start.x, end.y - start.y);

      return new Line(start, end, direction);
  }

  this.getCenterOfX = function(strokes) {
    var centerOfStroke1 = getCenterOfStroke(strokes[0]);
    var centerOfStroke2 = getCenterOfStroke(strokes[1]);
    var point = {
      x: Math.floor((centerOfStroke1.x + centerOfStroke2.x) / 2),
      y: Math.floor((centerOfStroke1.y + centerOfStroke2.y) / 2)
    };
    return point;
  }

  // Helper methods
  function getDeviation(stroke) {
    // parameter for equation y = a*x + b
    var a = (stroke[stroke.length - 1].y - stroke[0].y) / (stroke[stroke.length - 1].x - stroke[0].x);
    var b = stroke[0].y - a * stroke[0].x;

    var error = 0;
    for (var i = 0; i < stroke.length; i++) {
      var functionY = a * stroke[i].x + b;
      error += Math.abs(functionY - stroke[i].y);
    }
    return error / stroke.length;
  }

  function getCenterOfStroke(stroke) {
    var start = stroke[0];
    var end = stroke[stroke.length - 1];
    return new Point(Math.floor((start.x + end.x) / 2), Math.floor((start.y + end.y) / 2));
  }

}
