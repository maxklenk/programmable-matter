// This file handles the drawing

//
// Startup
//
var _isDown, _points, _strokes, _r, _g, _rc; // global variables

function onLoadEvent() {
  _points = new Array(); // point array for current stroke
  _strokes = new Array(); // array of point arrays
  _r = new NDollarRecognizer(document.getElementById('useBoundedRotationInvariance').checked);

  var canvas = document.getElementById('myCanvas');
  canvas.setAttribute('height', 600);
  canvas.setAttribute('width', 800);
  _g = canvas.getContext('2d');
  _g.lineWidth = 3;
  _g.font = "16px Gentilis";
  _rc = getCanvasRect(canvas); // canvas rect on page
  _g.fillStyle = "rgb(255,255,136)";
  _g.fillRect(0, 0, _rc.width, 20);

  _isDown = false;

}

function getCanvasRect(canvas) {
  var w = canvas.width;
  var h = canvas.height;

  var cx = canvas.offsetLeft;
  var cy = canvas.offsetTop;
  while (canvas.offsetParent != null)
  {
    canvas = canvas.offsetParent;
    cx += canvas.offsetLeft;
    cy += canvas.offsetTop;
  }
  return {x: cx, y: cy, width: w, height: h};
}

function getScrollY() {
  var scrollY = 0;
  if (typeof(document.body.parentElement) != 'undefined')
  {
    scrollY = document.body.parentElement.scrollTop; // IE
  }
  else if (typeof(window.pageYOffset) != 'undefined')
  {
    scrollY = window.pageYOffset; // FF
  }
  return scrollY;
}

//
// Checkbox option for using limited rotation invariance requires rebuilding the recognizer.
//
function confirmRebuild() {
  if (confirm("Changing this option will discard any user-defined gestures you may have made."))
  {
    _r = new NDollarRecognizer(document.getElementById('useBoundedRotationInvariance').checked);
  }
  else
  {
    var chk = document.getElementById('useBoundedRotationInvariance');
    chk.checked = !chk.checked; // undo click
  }
}

//
// Mouse Events
//
function mouseDownEvent(x, y, button) {
  document.onselectstart = function() { return false; } // disable drag-select
  document.onmousedown = function() { return false; } // disable drag-select
  if (button <= 1)
  {
    _isDown = true;
    x -= _rc.x;
    y -= _rc.y - getScrollY();
    if (_points.length == 0)
    {
      _strokes.length = 0;
      _g.clearRect(0, 0, _rc.width, _rc.height);
    }
    _points.length = 1; // clear
    _points[0] = new Point(x, y);
    drawText("Recording stroke #" + (_strokes.length + 1) + "...");
    var clr = "rgb(" + rand(0,200) + "," + rand(0,200) + "," + rand(0,200) + ")";
    _g.strokeStyle = clr;
    _g.fillStyle = clr;
    _g.fillRect(x - 4, y - 3, 9, 9);
  }
  else if (button == 2)
  {
    drawText("Recognizing gesture...");
  }
}

function mouseMoveEvent(x, y, button) {
  if (isDragging) {
    return;
  }
  if (_isDown)
  {
    x -= _rc.x;
    y -= _rc.y - getScrollY();
    _points[_points.length] = new Point(x, y); // append
    drawConnectedPoint(_points.length - 2, _points.length - 1);
  }
}

function mouseUpEvent(x, y, button) {
  document.onselectstart = function() { return true; } // enable drag-select
  document.onmousedown = function() { return true; } // enable drag-select
  if (button <= 1)
  {
    if (_isDown)
    {
      _isDown = false;
      _strokes[_strokes.length] = _points.slice(); // add new copy to set
      drawText("Stroke #" + _strokes.length + " recorded.");
    }
  }
  else if (button == 2) // segmentation with right-click
  {
    if (_strokes.length > 1 || (_strokes.length == 1 && _strokes[0].length >= 10))
    {
      var result = _r.Recognize(_strokes, document.getElementById('useBoundedRotationInvariance').checked, document.getElementById('requireSameNoOfStrokes').checked, document.getElementById('useProtractor').checked);
      drawText("Result: " + result.Name + " (" + round(result.Score,2) + ").");
      var shapeBuilder = new ShapeBuilder();
      switch (result.Name) {
        case "Rectangle":
          var rectangle = shapeBuilder.getRectangle(_strokes[0]);
          addRectangle(rectangle.X, rectangle.Y, rectangle.Width, rectangle.Height);
          break;
        case "Circle":
          var circle = shapeBuilder.getCircle(_strokes[0]);
          addCircle(circle.X, circle.Y, circle.Radius);
      }

    }
    else
    {
      drawText("Too little input made. Please try again.");
    }
    _points.length = 0; // clear and signal to clear strokes on next mousedown
  }
}

function drawConnectedPoint(from, to) {
  _g.beginPath();
  _g.moveTo(_points[from].X, _points[from].Y);
  _g.lineTo(_points[to].X, _points[to].Y);
  _g.closePath();
  _g.stroke();
}

function drawText(str) {
  _g.fillStyle = "rgb(255,255,136)";
  _g.fillRect(0, 0, _rc.width, 20);
  _g.fillStyle = "rgb(0,0,255)";
  _g.fillText(str, 1, 14);
}

function rand(low, high) {
  return Math.floor((high - low + 1) * Math.random()) + low;
}

function round(n, d) { // round 'n' to 'd' decimals
  d = Math.pow(10, d);
  return Math.round(n * d) / d
}

//
// Multistroke Adding and Clearing
//
function onClickAddExisting() {
  if (_strokes.length > 0)
  {
    if (_strokes.length < 5 || confirm("With " + _strokes.length + " component strokes, it will take a few moments to add this gesture. Proceed?"))
    {
      var multistrokes = document.getElementById('multistrokes');
      var name = multistrokes[multistrokes.selectedIndex].value;
      var num = _r.AddGesture(name, document.getElementById('useBoundedRotationInvariance').checked, _strokes);
      drawText("\"" + name + "\" added. Number of \"" + name + "\"s defined: " + num + ".");
      _points.length = 0; // clear and signal to clear strokes on next mousedown
    }
  }
}

function onClickAddCustom() {
  var name = document.getElementById('custom').value;
  if (_strokes.length > 0 && name.length > 0)
  {
    if (_strokes.length < 5 || confirm("With " + _strokes.length + " component strokes, it will take a few moments to add this gesture. Proceed?"))
    {
      var num = _r.AddGesture(name, document.getElementById('useBoundedRotationInvariance').checked, _strokes);
      drawText("\"" + name + "\" added. Number of \"" + name + "\"s defined: " + num + ".");
      _points.length = 0; // clear and signal to clear strokes on next mousedown
    }
  }
}

function onClickCustom() {
  document.getElementById('custom').select();
}

function onClickDelete() {
  var num = _r.DeleteUserGestures(); // deletes any user-defined multistrokes
  alert("All user-defined gestures have been deleted. Only the 1 predefined gesture remains for each of the " + num + " types.");
  _points.length = 0; // clear and signal to clear strokes on next mousedown
}

function onClickClearStrokes() {
  _points.length = 0; // clear and signal to clear strokes on next mousedown
  _g.clearRect(0, 0, _rc.width, _rc.height);
  drawText("Canvas cleared.");
}
