var bodyFromMenu = undefined;
var bodyPropertiesForBodyId = {};
var lastScale = undefined;
var bodyProperties = {};

function showMenu(point, body) {
  console.log(body);
  bodyFromMenu = body;
  var menu = jQuery('.element-menu');
  bodyProperties.angle = body.angle;
  //TODO: set properties of menu according to body
  if (bodyPropertiesForBodyId[body.id]) {
    jQuery('#angle').val(bodyPropertiesForBodyId[body.id].angle * 180/3.14159);
  } else {
    jQuery('#angle').val('0');
    bodyPropertiesForBodyId[body.id] = {};
    bodyPropertiesForBodyId[body.id].angle = body.angle;
    bodyPropertiesForBodyId[body.id].startAngle = body.angle;
  }
  var canvasContainer = jQuery('#myCanvas');
  var top = point.y + canvasContainer.offset().top - (menu.height())/2;
  var left = point.x + canvasContainer.offset().left;

  menu.css({"display": "block", "top": top, "left": left });
}

function scaleBody(factor) {
    if (lastScale === undefined) {
      lastScale = factor;
    }
    var newScale = factor / lastScale;
    console.log("lastScale: " + lastScale + " newScale: " + newScale);
    lastScale = factor;
    myMatter.setScaleOfBody(bodyFromMenu, newScale, newScale);
}

function rotateBody(degrees) {
    var radians = degrees * (Math.PI / 180);
    bodyPropertiesForBodyId[bodyFromMenu.id].angle = bodyPropertiesForBodyId[bodyFromMenu.id].startAngle + radians;
    myMatter.setAngleOfBody(bodyFromMenu, bodyPropertiesForBodyId[bodyFromMenu.id].angle)
}

function setStaticProperty(isStatic) {
    myMatter.setStaticOfBody(bodyFromMenu, isStatic);
    resetMenu();
}

function resetMenu() {
    var menu = jQuery('.element-menu');
    menu.css({"display": "none"})
}
