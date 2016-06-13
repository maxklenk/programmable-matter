'use strict';

var myCanvas = (function() {
    var myCanvas = {
        init: init,
        checkForModeActivation: checkForModeActivation,
        checkForModeDeactivation: checkForModeDeactivation,
        mouseDownEvent: mouseDownEvent,
        mouseUpEvent: mouseUpEvent,
        mouseMoveEvent: mouseMoveEvent
    };

    var _points, _strokes, _r, _g, _rc, _numStrokes, _multipleBodies, _bodies;


    // This file handles the drawing

    //
    // Startup
    //

    function init() {
        _points = new Array(); // point array for current stroke
        _strokes = new Array(); // array of point arrays
        _multipleBodies = new Array();
        _bodies = new Array();
        _numStrokes = 0;

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


    function mouseDownEvent(x, y, button) {
        if (myMatter.state.isHandling) {
            return;
        }

        myMatter.state.isDrawing = true;
        document.onselectstart = function() { return false; } // disable drag-select
        document.onmousedown = function() { return false; } // disable drag-select

        _numStrokes++;
        x -= _rc.x;
        y -= _rc.y - getScrollY();

        _points.length = 1; // clear
        _points[0] = new Point(x, y);
        drawText("Recording stroke #" + (_strokes.length + 1) + "...");
        var clr = "rgb(" + rand(0,200) + "," + rand(0,200) + "," + rand(0,200) + ")";
        _g.strokeStyle = clr;
        _g.fillStyle = clr;
        _g.fillRect(x - 4, y - 3, 9, 9);
    }

    function mouseMoveEvent(x, y, button) {
        if (myMatter.state.isHandling) {
            return;
        }
        if (myMatter.state.isDrawing) {
            x -= _rc.x;
            y -= _rc.y - getScrollY();
            _points[_points.length] = new Point(x, y); // append
            drawConnectedPoint(_points.length - 2, _points.length - 1);
        }
    }

    function mouseUpEvent(x, y, button) {
        document.onselectstart = function() { return true; } // enable drag-select
        document.onmousedown = function() { return true; } // enable drag-select

        _strokes[_strokes.length] = _points.slice(); // add new copy to set
        drawText("Stroke #" + _strokes.length + " recorded.");

        if (myMatter.state.multipleBodiesMode) {
            _multipleBodies.push(_strokes);
            _strokes = [];
            _points = [];
        } else {
            setTimeout(function() {
                _numStrokes = _numStrokes <= 0 ? 0 : _numStrokes - 1;
                if (_numStrokes === 0) {
                    recognizeBody(_strokes);
                    drawFinished();
                }
            },1000);
        }
    }

    function drawConnectedPoint(from, to) {
        _g.beginPath();
        _g.moveTo(_points[from].x, _points[from].y);
        _g.lineTo(_points[to].x, _points[to].y);
        _g.closePath();
        _g.stroke();
    }

    function drawText(str) {
        _g.fillStyle = "rgb(255,255,136)";
        _g.fillRect(0, 0, _rc.width, 20);
        _g.fillStyle = "rgb(0,0,255)";
        _g.fillText(str, 1, 14);
    }

    function getScrollY() {
        return window.pageYOffset;
    }

    function rand(low, high) {
        return Math.floor((high - low + 1) * Math.random()) + low;
    }

    function round(n, d) { // round 'n' to 'd' decimals
        d = Math.pow(10, d);
        return Math.round(n * d) / d
    }

    function clearCanvas() {
        _points = [];
        _multipleBodies = [];
        _bodies = [];
        _strokes = [];
        _g.clearRect(0, 0, _rc.width, _rc.height);
    }

    function drawFinished() {
        myMatter.state.isDrawing = false;
        clearCanvas();
    }

    function activateMultipleBodiesMode(event) {
        jQuery('.multipleBodiesButton').css({
            'background-color': '#c55'
        });
        myMatter.state.multipleBodiesMode = true;
    }

    function deactivateMultipleBodiesMode(event) {
        jQuery('.multipleBodiesButton').css({
            'background-color': '#5c5'
        });
        _numStrokes = 0;
        recognizeMultipleBodies();
        myMatter.state.multipleBodiesMode = false;
        drawFinished();
    }

    function checkForModeActivation(event) {
        switch (event.keyCode) {
            case 16:
                activateMultipleBodiesMode();
                break;
            case 32:
                myMatter.togglePlay();
                break;
            default:
        }
    }

    function checkForModeDeactivation(event) {
        switch (event.keyCode) {
            case 16:
                deactivateMultipleBodiesMode();
                break;
            default:
        }
    }

    function recognizeBody(strokes) {
        if (strokes.length > 1 || (strokes.length == 1 && strokes[0].length >= 10))
        {
            var result = _r.Recognize(strokes, document.getElementById('useBoundedRotationInvariance').checked, document.getElementById('requireSameNoOfStrokes').checked, document.getElementById('useProtractor').checked);
            drawText("Result: " + result.Name + " (" + round(result.Score,2) + ").");
            console.log(result.Name);
            var shapeBuilder = new ShapeBuilder();
            switch (result.Name) {
                case "Rectangle":
                var rectangle = shapeBuilder.getRectangle(strokes[0]);
                if (myMatter.state.multipleBodiesMode) {
                    _bodies.push(myMatter.getRectangle(rectangle.x, rectangle.y, rectangle.Width, rectangle.Height));
                } else {
                    myMatter.addRectangle(rectangle.x, rectangle.y, rectangle.Width, rectangle.Height);
                }
                break;
                case "Circle":
                var circle = shapeBuilder.getCircle(strokes[0]);
                if (myMatter.state.multipleBodiesMode) {
                    _bodies.push(myMatter.getCircle(circle.x, circle.y, circle.Radius));
                } else {
                    myMatter.addCircle(circle.x, circle.y, circle.Radius);
                }

                break;
                case "Arrow":
                var arrow = shapeBuilder.getArrow(_strokes);
                if (arrow) {
                    myMatter.addVector(arrow);
                }
                break;
                case "X":
                var center = shapeBuilder.getCenterOfX(strokes);
                myMatter.removeBodyAt(center);
            }

        }
        else
        {
            drawText("Too little input made. Please try again.");
        }
    }

    function recognizeMultipleBodies() {
        console.log(_multipleBodies);
        for (var i = 0; i < _multipleBodies.length; i++) {
            recognizeBody(_multipleBodies[i]);
        }
        console.log("Bodies: ");
        console.log(_bodies);
        myMatter.addCompound(_bodies);
        clearCanvas();
    }

    return myCanvas;
})();
