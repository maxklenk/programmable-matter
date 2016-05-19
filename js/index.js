function showMenu(point, body) {
  console.log(body);
  Matter.Body.scale(body, 1.5, 1.5);
  var menu = jQuery('.element-menu');
  var canvasContainer = jQuery('#myCanvas');
  var top = point.y + canvasContainer.offset().top - (menu.height())/2;
  var left = point.x + canvasContainer.offset().left;

  menu.css({"display": "block", "top": top, "left": left });
}
