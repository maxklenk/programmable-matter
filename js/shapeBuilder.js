function ShapeBuilder() {
  function Point(x, y) // constructor
  {
    this.X = x;
    this.Y = y;
  }

  function Rectangle(x, y, width, height) // constructor
  {
    this.X = x;
    this.Y = y;
    this.Width = width;
    this.Height = height;
  }

  function Circle(x, y, radius) // constructor
  {
    this.X = x;
    this.Y = y;
    this.Radius = radius;
  }

  function Arrow(start, direction, magnitude)  // constructor
  {
    this.Start = start;
    this.Direction = direction;
    this.Magnitude = magnitude;
  }

  // Is currently bounding box; could be improved to be more precise
  this.getRectangle = function(strokes) {
    var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    for (var i = 0; i < strokes.length; i++) {
      minX = Math.min(minX, strokes[i].X);
      minY = Math.min(minY, strokes[i].Y);
      maxX = Math.max(maxX, strokes[i].X);
      maxY = Math.max(maxY, strokes[i].Y);
    }
    var centerX = minX + (maxX - minX) / 2;
    var centerY = minY + (maxY - minY) / 2;
    return new Rectangle(centerX, centerY, maxX - minX, maxY - minY);
  }

  this.getCircle = function(strokes) {
    var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
    for (var i = 0; i < strokes.length; i++) {
      minX = Math.min(minX, strokes[i].X);
      minY = Math.min(minY, strokes[i].Y);
      maxX = Math.max(maxX, strokes[i].X);
      maxY = Math.max(maxY, strokes[i].Y);
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
    var distanceToArrowPart1 = Math.sqrt( Math.pow(strokes[directionPartIndex][0].X - strokes[arrowPartIndex][centerOfArrowPart].X, 2) + Math.pow(strokes[directionPartIndex][0].Y - strokes[arrowPartIndex][centerOfArrowPart].Y, 2));
    var distanceToArrowPart2 = Math.sqrt( Math.pow(strokes[directionPartIndex][strokes[directionPartIndex].length - 1].X - strokes[arrowPartIndex][centerOfArrowPart].X, 2) - Math.pow(strokes[directionPartIndex][strokes[directionPartIndex].length - 1].Y - strokes[arrowPartIndex][centerOfArrowPart].Y, 2));
    var start = distanceToArrowPart1 < distanceToArrowPart2 ? strokes[directionPartIndex][strokes[directionPartIndex].length - 1] : strokes[directionPartIndex][0];
    var end = distanceToArrowPart1 < distanceToArrowPart2 ? strokes[directionPartIndex][0] : strokes[directionPartIndex][strokes[directionPartIndex].length - 1];

    var direction = new Point(end.X - start.X, end.Y - start.Y);
    var magnitude = Math.sqrt(Math.pow(direction.X, 2), Math.pow(direction.Y, 2));
    return new Arrow(start, direction, magnitude);
  }

  // Helper methods
  function getDeviation(stroke) {
    // parameter for equation y = a*x + b
    var a = (stroke[stroke.length - 1].Y - stroke[0].Y) / (stroke[stroke.length - 1].X - stroke[0].X);
    var b = stroke[0].Y - a * stroke[0].X;

    var error = 0;
    for (var i = 0; i < stroke.length; i++) {
      var functionY = a * stroke[i].X + b;
      error += Math.abs(functionY - stroke[i].Y);
    }
    return error / stroke.length;
  }

}
