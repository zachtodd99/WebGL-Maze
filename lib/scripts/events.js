/**
 * learn_webgl_events_01.js, By Wayne Brown, Fall 2015
 *
 * These event handlers can modify the characteristics of a scene.
 * These will be specific to a scene's models and the models' attributes.
 */

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 C. Wayne Brown
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

//-------------------------------------------------------------------------
function Events(scene, control_id_list, map) {


  //this.mouse_scroll_started = function(event) {
  //
  //  start_of_scroll = event;
  //  event.preventDefault();
  //
  //
  //}


  //-----------------------------------------------------------------------
  this.mouse_drag_started = function (event) {

    //console.log("started mouse drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    start_of_mouse_drag = event;
    event.preventDefault();

  };

  //-----------------------------------------------------------------------
  this.mouse_drag_ended = function (event) {

    //console.log("ended mouse drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    start_of_mouse_drag = null;
    event.preventDefault();

  };

  //-----------------------------------------------------------------------
  this.mouse_dragged = function (event) {
    var delta_x, delta_y;

    //console.log("drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    if (start_of_mouse_drag) {
      delta_x = event.clientX - start_of_mouse_drag.clientX;
      delta_y = -(event.clientY - start_of_mouse_drag.clientY);
      //console.log("moved: " + delta_x + " " + delta_y);

      delta_x = delta_x/2;
      delta_y = delta_y/2;


      if (scene.angle_x - delta_y > -90 && scene.angle_x - delta_y < 90) {
        scene.angle_x -= delta_y; //comment this out to prevent the user from looking up and down
      }
      scene.angle_y -= delta_x;
      scene.render();

      start_of_mouse_drag = event;
      event.preventDefault();
    }
  };

  //-----------------------------------------------------------------------
  this.key_event = function (event) {
    var bounds, keycode;

    bounds = canvas.getBoundingClientRect();
    console.log("bounds = " + bounds.left + " " + bounds.right + "  " + bounds.top + "  " + bounds.bottom);
    console.log("target = " + event.target);
    if (event.clientX >= bounds.left &&
      event.clientX <= bounds.right &&
      event.clientY >= bounds.top &&
      event.clientY <= bounds.bottom) {
      keycode = (event.keyCode ? event.keyCode : event.which);
      console.log(keycode + " keyboard event in canvas");
    }

    event.preventDefault();

    console.log(keycode);

    switch (keyCode) {
      case myGame.RIGHT_ARROW:
        myGame.rotateRight();
        break;

      case myGame.LEFT_ARROW:
        myGame.rotateLeft();
        break;

      case myGame.UP_ARROW:
        myGame.rotateBackwards();
        break;

      case myGame.DOWN_ARROW:
        // Don't allow the down arrow to scroll the window down
        event.preventDefault();
        myGame.rotateForwards();
        break;
    }

    return false;
  };

  //------------------------------------------------------------------------------
  this.html_control_event = function (event) {
    var control;

    console.log('event happened');
    control = $(event.target);
    var movementSize = 1;
    if (control) {
      switch (control.attr('id')) {
        case "left":
          var tz = -Math.sin(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          var tx = Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          var curX = Math.floor(map.player_x / 18);
          var curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx;
            map.player_z += tz;
            map.checkPositionForFalling();
          }
          scene.render();
          break;
        case "right":
          tz = -Math.sin(-scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx;
            map.player_z += tz;
            map.checkPositionForFalling();
          }
          scene.render();
          break;
        case "up":
          tz = Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.sin(-scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x +=tx;
            map.player_z +=tz;
            map.checkPositionForFalling();
            scene.render();
          }

          break;
        case "down":
          tz = -Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.sin(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx ;
            map.player_z += tz;
            map.checkPositionForFalling();
            scene.render();
          }
          break;
      }
    }
  };


  //------------------------------------------------------------------------------
  this.removeAllEventHandlers = function () {
    var j;
    for (j = 0; j < control_id_list.length; j += 1) {
      var control = $('#' + control_id_list);
      if (control) {
        control.unbind("click", self.html_control_event);
      }
    }
  };

  //------------------------------------------------------------------------------
  // Constructor code for the class.

  // Private variables
  var self = this;
  var out = scene.out;    // Debugging and output goes here.
  var canvas = scene.canvas;

  // Remember the current state of events
  var start_of_mouse_drag = null;



  // Control the rate at which animations refresh
  var frame_rate = 30; // 33 milliseconds = 1/30 sec
  //var frame_rate = 0; // gives screen refresh rate (60 fps)

  // Add an onclick callback to each HTML control
  var j;
  for (j = 0; j < control_id_list.length; j += 1) {
    var id = '#' + control_id_list[j];
    var control = $(id);
    if (control) {
      var control_type = control.prop('type');
      if (control_type === 'checkbox') {
        control.click(self.html_control_event);
      } else if (control_type === 'submit' || control_type === 'button' || control_type === 'radio') {
        control.click(self.html_control_event);
      } else {
        //control.on( 'input', self.html_control_event );
        var a = document.getElementById(control_id_list[j]);
        document.addEventListener('input', self.html_control_event)
      }
    }
  }

  $(document).keydown(function(e) {
        var movementSize = 1;
    switch(e.which) {
        case 37: // left
          var tz = -Math.sin(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          var tx = Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          var curX = Math.floor(map.player_x / 18);
          var curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx;
            map.player_z += tz;
            map.checkPositionForFalling();
          }
          scene.render();

        break;

        case 38: // up
          tz = Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.sin(-scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x +=tx;
            map.player_z +=tz;
            map.checkPositionForFalling();
            scene.render();
          }
        break;

        case 39: // right
          tz = -Math.sin(-scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx;
            map.player_z += tz;
            map.checkPositionForFalling();
          }
          scene.render();
        break;

        case 40: // down
          tz = -Math.cos(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          tx = -Math.sin(scene.angle_y / 360 * (Math.PI * 2)) * movementSize;
          curX = Math.floor(map.player_x / 18);
          curZ = Math.floor(map.player_z / 18);


          if (map.checkMovement(map.player_x, map.player_z, tx*5, tz*5, curX, curZ)) {
            map.player_x += tx ;
            map.player_z += tz;
            map.checkPositionForFalling();
            scene.render();
          }
        break;

        default: return; // exit this handler for other keys

    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});
}



