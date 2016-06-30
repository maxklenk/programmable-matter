var bodyFromMenu = undefined;
var bodyPropertiesForBodyId = {};
var lastScale = undefined;
var bodyProperties = {};

function showMenu(point, body) {
  bodyFromMenu = body;
  var menu = jQuery('.element-menu');
  bodyProperties.angle = body.angle;
  //TODO: set properties of menu according to body
  if (bodyPropertiesForBodyId[body.id]) {
    console.log(bodyPropertiesForBodyId[body.id]);
    jQuery('#angle').val(bodyPropertiesForBodyId[body.id].angle * 180/3.14159);
    jQuery('#size').val(bodyPropertiesForBodyId[body.id].scale * 1000);
    jQuery('#sticky').prop('checked', bodyPropertiesForBodyId[body.id].isStatic);
    jQuery('#density').val(bodyPropertiesForBodyId[body.id].density * 100000);
  } else {
    jQuery('#angle').val('0');
    jQuery('#size').val('1000');
    jQuery('#sticky').prop('checked', false);
    jQuery('#density').val('100');
    bodyPropertiesForBodyId[body.id] = {};
    bodyPropertiesForBodyId[body.id].angle = body.angle;
    bodyPropertiesForBodyId[body.id].startAngle = body.angle;
    bodyPropertiesForBodyId[body.id].scale = 1;
    bodyPropertiesForBodyId[body.id].isStatic = false;
    bodyPropertiesForBodyId[body.id].density = body.density;
  }
  var canvasContainer = jQuery('#myCanvas');
  var top = point.y + canvasContainer.offset().top - (menu.height())/2;
  var left = point.x + 20 + canvasContainer.offset().left;

  menu.css({"display": "block", "top": top, "left": left });
}

function scaleBody(factor) {
    if (bodyPropertiesForBodyId[bodyFromMenu.id].lastScale === undefined) {
      lastScale = factor;
    }
    var newScale = factor / lastScale;
    bodyPropertiesForBodyId[bodyFromMenu.id].scale = factor;
    lastScale = factor;
    bodyPropertiesForBodyId[bodyFromMenu.id].lastScale = factor;
    myMatter.setScaleOfBody(bodyFromMenu, newScale, newScale);
}

function rotateBody(degrees) {
    var radians = degrees * (Math.PI / 180);
    bodyPropertiesForBodyId[bodyFromMenu.id].angle = bodyPropertiesForBodyId[bodyFromMenu.id].startAngle + radians;
    myMatter.setAngleOfBody(bodyFromMenu, bodyPropertiesForBodyId[bodyFromMenu.id].angle)
}

function changeDensityOfBody(density) {
  bodyPropertiesForBodyId[bodyFromMenu.id].density = density;
  myMatter.setDensityOfBody(bodyFromMenu, bodyPropertiesForBodyId[bodyFromMenu.id].density)
}

function setStaticProperty(isStatic) {
  bodyPropertiesForBodyId[bodyFromMenu.id].isStatic = isStatic;
  myMatter.setStaticOfBody(bodyFromMenu, isStatic);
}

function resetMenu() {
    var menu = jQuery('.element-menu');
    menu.css({"display": "none"})
}

function setXGravity(x) {
  myMatter.world.gravity.x = x;
}

function setYGravity(y) {
  myMatter.world.gravity.y = y;
}

function toggleList(element) {
	var content = $(element).siblings('.content');
	if (content.is(':hidden')) {
		content.slideDown('200');
		$(element).addClass('fa-angle-down').removeClass('fa-angle-right');
	} else {
		content.slideUp('200');
		$(element).addClass('fa-angle-right').removeClass('fa-angle-down');
	}
}
