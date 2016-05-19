function showMenu(point, body) {
  var menu = jQuery('.element-menu');
  var canvasContainer = jQuery('#myCanvas');
  var top = point.y + canvasContainer.offset().top - (menu.height())/2;
  var left = point.x + canvasContainer.offset().left;

  menu.css({"display": "block", "top": top, "left": left });
}
