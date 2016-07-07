'use strict';

var myCanvas = (function() {
    var myCanvas = {
        init: init,
        checkForModeActivation: checkForModeActivation,
        checkForModeDeactivation: checkForModeDeactivation,
        toggleMultipleBodiesMode: toggleMultipleBodiesMode,
        mouseDownEvent: mouseDownEvent,
        mouseUpEvent: mouseUpEvent,
        mouseMoveEvent: mouseMoveEvent
    };

    var _points, _strokes, _r, _g, _rc, _numStrokes, _bodies, _isDown, _shapeBuilder;


    // This file handles the drawing

    //
    // Startup
    //

    function init() {
        _points = new Array(); // point array for current stroke
        _strokes = new Array(); // array of point arrays
        _bodies = new Array();
        _numStrokes = 0;
        _shapeBuilder = new ShapeBuilder();
        _r = new NDollarRecognizer(false);

        var canvas = document.getElementById('myCanvas');
        canvas.setAttribute('height', 600);
        canvas.setAttribute('width', 800);
        _g = canvas.getContext('2d');
        _rc = getCanvasRect(canvas); // canvas rect on page
        _g.fillStyle = "rgb(255,255,136)";

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
        event.stopPropagation();
        event.preventDefault();
        if (myMatter.state.isHandling) {
            return;
        }
        _isDown = true;
        myMatter.state.isDrawing = true;

        _numStrokes++;
        x -= _rc.x;
        y -= _rc.y - getScrollY();

        _points.length = 1; // clear
        _points[0] = new Point(x, y);
        var clr = "rgb(" + rand(0,200) + "," + rand(0,200) + "," + rand(0,200) + ")";
        _g.strokeStyle = clr;
        _g.fillStyle = clr;
        _g.fillRect(x - 4, y - 3, 9, 9);
    }

    function mouseMoveEvent(x, y, button, event) {
        if (myMatter.state.isHandling) {
            return;
        }
        event.stopPropagation();
        event.preventDefault();
        if (myMatter.state.isDrawing && _isDown) {
            x -= _rc.x;
            y -= _rc.y - getScrollY();
            _points[_points.length] = new Point(x, y); // append
            drawConnectedPoint(_points.length - 2, _points.length - 1);
        }
    }

    function mouseUpEvent(x, y, button) {
        if (myMatter.state.isHandling) {
            return;
        }
        _isDown = false;

        _strokes[_strokes.length] = _points.slice(); // add new copy to set

        if (myMatter.state.multipleBodiesMode) {
            recognizeBody(_strokes);
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
        _bodies = [];
        _strokes = [];
        _g.clearRect(0, 0, _rc.width, _rc.height);
    }

    function drawFinished() {
        myMatter.state.isDrawing = false;
        clearCanvas();
    }

    var $multipleBodies = $('.multipleBodiesButton');
    function toggleMultipleBodiesMode() {
        if ($multipleBodies.hasClass('is-active')) {
            deactivateMultipleBodiesMode();
        } else {
            activateMultipleBodiesMode();
        }
    }

    function activateMultipleBodiesMode() {
        myMatter.state.multipleBodiesMode = true;
        $multipleBodies.addClass('is-active');
    }

    function deactivateMultipleBodiesMode() {
        _numStrokes = 0;
        recognizeMultipleBodies();
        myMatter.state.multipleBodiesMode = false;
        drawFinished();
        $multipleBodies.removeClass('is-active');
    }

    function checkForModeActivation(event) {
        switch (event.keyCode) {
            case 16:
                activateMultipleBodiesMode();
                break;
            case 32:
                togglePlay();
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
        if (strokes.length == 1 && strokes[0].length < 10) {
            return;
        }
        if (strokes[0].length === 0) {
            strokes.shift();
        }
        console.log(strokes);
        var result = _r.Recognize(strokes, false, false, false);
        console.log(result.Name);
        switch (result.Name) {
            case "Rectangle":
                var rectangle = _shapeBuilder.getRectangle(strokes[0]);
                if (myMatter.state.multipleBodiesMode) {
                    _bodies.push(myMatter.getRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height));
                } else {
                    myMatter.addRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
                }
                break;
            case "Circle":
                var circle = _shapeBuilder.getCircle(strokes[0]);
                if (myMatter.state.multipleBodiesMode) {
                    _bodies.push(myMatter.getCircle(circle.x, circle.y, circle.radius));
                } else {
                    myMatter.addCircle(circle.x, circle.y, circle.radius);
                }
                break;
            case "Arrow":
                var arrow = _shapeBuilder.getArrow(_strokes);
                if (arrow) {
                    myMatter.addVector(arrow);
                }
                break;
            case "Line":
                var line = _shapeBuilder.getLine(_strokes);
                if (line) {
                    myMatter.addLine(line);
                }
                break;
            case "X":
                var center = _shapeBuilder.getCenterOfX(strokes);
                myMatter.removeBodyAt(center);
        }
    }

    function recognizeMultipleBodies() {
        console.log("Bodies: ");
        console.log(_bodies);
        myMatter.addCompound(_bodies);
        clearCanvas();
    }

    return myCanvas;
})();
