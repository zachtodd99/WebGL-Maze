/**
 * learn_webgl_render_01.js, By Wayne Brown, Fall 2015
 *
 * Given
 *   - a model definition as defined in learn_webgl_model_01.js, and
 *   - specific shader programs: vShader01.vert, fShader01.frag
 * Perform the following tasks:
 *   1) Build appropriate Vertex Object Buffers (VOB's)
 *   2) Create GPU VOB's for the data and copy the data into the buffers.
 *   3) Render the VOB's
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
// Build, create, copy and render 3D objects specific to a particular
// model definition and particular WebGL shaders.
//-------------------------------------------------------------------------

var MazeRender = function (learn, vshaders_dictionary,
                           fshaders_dictionary, models, controls) {

  // Private variables
  var self = this;
  var canvas_id = learn.canvas_id;
  var out = learn.out;

  var gl = null;
  var program = null;
  var scene_models = new Array(models.length);

  var matrix = new Learn_webgl_matrix();
  var V = new Learn_webgl_vector3();
  var container_transform = matrix.create();
  var widget_transform = matrix.create();
  var widget_transform_final = matrix.create();
  var projection = matrix.createOrthographic(-10.0, 10.0, -3.0, 12.0, -10.0, 10.0);

  var rotate_y_matrix_widget = matrix.create();

  var rotate_x_matrix = matrix.create();
  var rotate_y_matrix = matrix.create();
  var rotate_end_matrix = matrix.create();
  var translate_matrix = matrix.create();
  var translate_matrix2 = matrix.create();
  var background_translate = matrix.create();
  var background_transform = matrix.create();
  var background_rotatez = matrix.create();
  var background_scale = matrix.create();
  var end_transform = matrix.create();

  var scale_matrix = matrix.create();
  var end_scale = matrix.create();
  var point = new Learn_webgl_point4();
  var virtual_camera = matrix.create();
  var vm_transform = matrix.create();
  var ghost_transform = matrix.create();
  var ghost_rotate = matrix.create();
  var ghost_translate = matrix.create();
  var ghost_scale = matrix.create();
  matrix.lookAt(virtual_camera, 0, 0, 5, 0, 0, 0, 0, 1, 0);

  var map = new Map(8, self);

  // Public variables that will possibly be used or changed by event handlers.
  self.canvas = null;
  self.angle_x = 0.0;
  self.angle_y = 0.0;
  self.next_angle_x = 0.0;
  self.next_angle_y = 0.0;
  self.angle = 90.0;
  self.x_angle = 0.0;
  self.z_angle = 0.0;
  self.dy = 0.01;

  self.scale = 1.0;
  self.animate_active = true;
  self.light_position = point.create(0, 0, 0, 1);
  self.light_color = V.create(1, 1, 1);
  self.light_normal = V.create(0, 0, -1);
  self.light_angle = 0.93;
  self.light_translate = matrix.create();
  self.light_rotate = matrix.create();
  self.light_transform = matrix.create();
  self.shininess = 80;
  self.ambient_color = V.create(0.0, 0.0, 0.0); // low level white light
  var light_in_camera_space = point.create(0, 0, 0);


  matrix.scale(scale_matrix, self.scale, self.scale, self.scale);

  //-----------------------------------------------------------------------
  this.render = function () {
    var j;

    matrix.rotate(rotate_x_matrix, self.angle_x, 1, 0, 0);
    matrix.rotate(rotate_y_matrix, self.angle_y, 0, 1, 0);
    matrix.translate(background_translate, 0, 0, 0);
    projection = matrix.createPerspective(45.0, 1.6, 0.1, 10000);
    var looking_at_x = map.player_x + Math.sin(self.angle_y / 360 * Math.PI*2)/ 2 - Math.sin(self.angle_x / 360) / 2;
    var looking_at_y = map.player_y + Math.sin(self.angle_x / 360 * Math.PI*2);
    var looking_at_z = map.player_z + Math.cos(self.angle_y / 360 * Math.PI*2)/ 2 - Math.sin(self.angle_x / 360) / 2;
    matrix.lookAt(virtual_camera, 9-map.player_x, -map.player_y, 9-map.player_z, 9-looking_at_x, -looking_at_y, 9-looking_at_z, 0, 1, 0);

    matrix.rotate(background_rotatez, 180, 1, 0, 0);
    matrix.scale(background_scale, 500, 500, 500);
    matrix.scale(end_scale, 8, 8, 8);
    matrix.scale(ghost_scale, 2, 6, 2);
    matrix.rotate(rotate_end_matrix, -90, 0, 1, 0);


    self.light_position = point.create(9-looking_at_x, -1-looking_at_y, 9-looking_at_z);
    self.light_normal = V.create(0, 0, -1);

    matrix.multiplyP4(light_in_camera_space, virtual_camera, self.light_position);
    gl.uniform3f(program.u_Light_position, light_in_camera_space[0],
      light_in_camera_space[1],
      light_in_camera_space[2]);
    gl.uniform3fv(program.u_Light_color, self.light_color);
    gl.uniform3fv(program.u_Ambient_color, self.ambient_color);
    gl.uniform1f(program.u_Shininess, self.shininess);
    gl.uniform3fv(program.u_Light_normal, self.light_normal);
    gl.uniform1f(program.u_Light_angle, self.light_angle);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    matrix.setIdentity(background_transform);
    matrix.setIdentity(end_transform);
    matrix.setIdentity(ghost_transform);


    for (j = 0; j < models.number_models; j += 1) {

      switch (scene_models[j].name) {

        case "background":
          matrix.translate(translate_matrix, -map.player_x, -map.player_y,-map.player_z);
          matrix.multiplySeries(vm_transform, virtual_camera, translate_matrix, background_rotatez, background_scale);
          matrix.multiplySeries(background_transform, projection, vm_transform);
          scene_models[j].render(background_transform, vm_transform);
          break;
        case "End":
          matrix.translate(translate_matrix, -map.end_x, 0, -map.end_z);
          matrix.multiplySeries(vm_transform, virtual_camera, translate_matrix, rotate_end_matrix, end_scale);
          matrix.multiplySeries(end_transform, projection,vm_transform);
          scene_models[j].render(end_transform, vm_transform);
          break;
        case "body":
          matrix.translate(ghost_translate, -(map.ghost_x), - 4, -(map.ghost_z));
          matrix.rotate(ghost_rotate, -90 * (map.ghost_dir - 1), 0, 1, 0);
          matrix.multiplySeries(vm_transform, virtual_camera, ghost_translate, ghost_rotate, ghost_scale);
          matrix.multiplySeries(ghost_transform, projection, vm_transform);
          scene_models[j].render(ghost_transform,vm_transform);
          break;
      }
    }

    for (var count1 = 0; count1 < map.size; count1++) {
      for (var count2 = 0; count2 < map.size; count2++) {
        if (map.pieces[count1][count2] != 0) {
          self.fix_transforms(map.pieces[count1][count2]);

          // Build individual transforms
          matrix.setIdentity(container_transform);
          matrix.setIdentity(widget_transform);
          matrix.setIdentity(widget_transform_final);


          matrix.rotate(rotate_y_matrix_widget, self.y_angle, 0, 1, 0); // this angle rotates the individual cube

          matrix.translate(translate_matrix2, count1 * -18, -5, count2 * -18); // move the box according to its location in the maze array

          // Combine the transforms into a single transformation
          matrix.multiplySeries(vm_transform, virtual_camera, translate_matrix2, rotate_y_matrix_widget, scale_matrix);
          matrix.multiplySeries(container_transform, projection, vm_transform);


          //Draw each model
          for (j = 0; j < models.number_models; j += 1) {
            if (map.pieces[count1][count2] != 0) {
              switch (scene_models[j].name) {
                case "Ceiling":
                  scene_models[j].render(container_transform, vm_transform);
                  break;
                case "Floor":
                  scene_models[j].render(container_transform, vm_transform);
                  break;
                case "Left_Wall":
                  if (map.pieces[count1][count2] != 15) {
                    scene_models[j].render(container_transform, vm_transform);
                  }
                  break;
                case "Right_Wall":
                  if (map.pieces[count1][count2] != 15 && (map.pieces[count1][count2] > 10 || map.pieces[count1][count2] < 3)) {
                    scene_models[j].render(container_transform, vm_transform);
                  }
                  break;
                case "Front_Wall":
                  if (map.pieces[count1][count2] > 6 && map.pieces[count1][count2] != 15) {
                    scene_models[j].render(container_transform, vm_transform);
                  }
                  break;
              }
            }
          }

        }
      }
    }
  };

  this.fall = function () {
    if (map.falling) {
      map.player_y += self.dy;
      if (self.dy < 4) {
        self.dy += 0.01;

      }
      if(map.player_y>250){
          map.resetMap();
        }
      self.render();
    }
  };

  this.fix_transforms = function (num) {
    switch (num) {
      //Empty
      case 0:
        self.y_angle = 0;
        break;
      //straight hallway NS
      case 1:
        self.y_angle = -90;
        break;
      case 2:
        self.y_angle = 0;
        break;
      case 3:
        self.y_angle = 180;
        break;
      case 4:
        self.y_angle = 90;
        break;
      case 5:
        self.y_angle = 0;
        break;
      case 6:
        self.y_angle = -90;
        break;
      case 7:
        self.y_angle = 180;
        break;
      case 8:
        self.y_angle = 90;
        break;
      case 9:
        self.y_angle = 0;
        break;
      case 10:
        self.y_angle = -90;
        break;
      case 11:
        self.y_angle = -90;
        break;
      case 12:
        self.y_angle = 180;
        break;
      case 13:
        self.y_angle = 90;
        break;
      case 14:
        self.y_angle = 0;
        break;
      case 15:
        self.y_angle = 0;
        break;


    }
  };


  //-----------------------------------------------------------------------
  this.delete = function () {
    var j;

    // Clean up shader programs
    gl.deleteShader(program.vShader);
    gl.deleteShader(program.fShader);
    gl.deleteProgram(program);

    // Delete each model's VOB
    for (j = 0; j < models.number_models; j += 1) {
      scene_models[j].delete(gl);
    }
    scene_models = {};

    // Remove all event handlers
    var id = '#' + canvas_id;
    $(id).unbind("mousedown", events.mouse_drag_started);
    $(id).unbind("mouseup", events.mouse_drag_ended);
    $(id).unbind("mousemove", events.mouse_dragged);
    events.removeAllEventHandlers();

    // Disable any animation
    self.animate_active = false;
  };


  //-----------------------------------------------------------------------
  // Object constructor. One-time initialization of the scene.

  // Get the rendering context for the canvas
  self.canvas = learn.getCanvas(canvas_id);
  if (self.canvas) {
    gl = learn.getWebglContext(self.canvas);
  }
  if (!gl) {
    return null;
  }

  // Set up the rendering program and set the state of webgl
  program = learn.createProgram(gl, vshaders_dictionary["shader"], fshaders_dictionary["shader"]);

  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.9, 0.9, 0.9, 1.0);

  // Create Vertex Object Buffers for the models
  var j;
  for (j = 0; j < models.number_models; j += 1) {
    scene_models[j] = new Learn_webgl_model_render(gl, program, models[j], out);
  }

  // Set up callbacks for user and timer events
  var events;

  events = new Events(self, controls, map);

  var id = '#' + canvas_id;
  $(id).mousedown(events.mouse_drag_started);
  $(id).mouseup(events.mouse_drag_ended);
  $(id).mousemove(events.mouse_dragged);



  var interval_var = window.setInterval(this.fall, 25);
  var interval_ghost = window.setInterval(map.moveGhost, 25);
  self.audio = new Audio('lib/scripts/mystery_and_suspense.mp3');
  self.audio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
  }, false);
  self.audio.play();


};

