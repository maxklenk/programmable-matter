var bodyFromMenu = undefined;
var bodyProperties = {};

function showMenu(point, body) {
  bodyFromMenu = body;
  bodyProperties.angle = body.angle;
  var menu = jQuery('.element-menu');
  var canvasContainer = jQuery('#myCanvas');
  var top = point.y + canvasContainer.offset().top - (menu.height())/2;
  var left = point.x + canvasContainer.offset().left;

  menu.css({"display": "block", "top": top, "left": left });
}

function scaleBody(factor) {
    console.log("Scale!!!");
    Matter.Body.scale(bodyFromMenu, factor, factor);
    resetMenu();
}

function rotateBody(degrees) {
    var radians = degrees * (Math.PI / 180);
    console.log("From " + bodyProperties.angle + " to " +  (bodyProperties.angle + radians));
    Matter.Body.setAngle(bodyFromMenu, bodyProperties.angle + radians);
}

function setStaticProperty(isStatic) {
    Matter.Body.setStatic(bodyFromMenu, isStatic);
    resetMenu();
}

function resetMenu() {
    var menu = jQuery('.element-menu');
    menu.css({"display": "none"})
}
