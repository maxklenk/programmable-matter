var bodyFromMenu = undefined;
var bodyPropertiesForBodyId = {};
var lastScale = undefined;
var bodyProperties = {};
var yGravity = undefined;
var xGravity = undefined;

$(document).ready(function(){
  initiaizeGravitySilders();
});

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

  var top = point.y - (menu.height())/2;
  var left = point.x + 40;

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


function togglePlay() {
  myMatter.togglePlay();
  resetMenu();
  toggleButton();
}

var $body = $(document.body);
$body.addClass('play').removeClass('pause'); // update once on setup
function toggleButton() {
  if (myMatter.state.playMode) {
    $body.addClass('play').removeClass('pause');
  } else {
    $body.addClass('pause').removeClass('play');
  }
}

var showLevelSelect = false;
var $level = $('.level-overlay');
function toggleLevelSelect() {
  showLevelSelect = !showLevelSelect;
  if (showLevelSelect) {
    $level.addClass('show');
  } else {
    $level.removeClass('show');
  }
  if (myMatter.state.playMode == showLevelSelect) {
    togglePlay();
  }
}

function initiaizeGravitySilders() {
  console.log('blup');

  xGravity = $('#xGravity--slider').CircularSlider({
    min: 0,
    max: 359,
    value: 180,
    shape: "Half Circle",
    innerCircleRatio: 0.9,
    radius: 40,
    formLabel : function(value, prefix, suffix) {
        return '<span class="fa fa-arrows-h"></span>';
    },
    slide: function(ui, value){
      setXGravity(value/180 - 1);
    }
  });

  yGravity = $('#yGravity--slider').CircularSlider({
    min: 0,
    max: 359,
    value: 359,
    shape: "Half Circle",
    innerCircleRatio: 0.9,
    radius: 40,
    formLabel : function(value, prefix, suffix) {
        return '<span class="fa fa-arrows-v"></span>';
    },
    slide: function(ui, value){
      setYGravity(value/180 - 1);
    }
  });
}

function setGravitySliders(xValue, yValue) {
  xGravity.setValue(xValue);
  yGravity.setValue(yValue);
}
