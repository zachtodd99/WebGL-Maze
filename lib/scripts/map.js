/**
 * Created by C16Zachary.Todd on 4/21/2016.
 */


var Map = function (size, scene) {

  var self = this;
  self.player_x = 9;
  self.player_y = 0;
  self.player_z = 9;

  self.falling = false;
  self.size = size;

  self.ghost_x = (self.size-1)*18+0.4;
  self.ghost_z = (self.size-1)*18+0.4;
  self.ghost_block_x = self.size-1;
  self.ghost_block_z = self.size-1;
  self.ghost_next_block_x = self.size-1;
  self.ghost_next_block_z = self.size-2;
  self.ghost_step = 0;
  self.ghost_speed = 0.2;
  self.ghost_dir = 1;

  //self.ghost_block_x = 0;   //testing
  //self.ghost_block_z = 0;
  //self.ghost_x = 0.4;
  //self.ghost_z = 0.4;
  // self.ghost_dir = 3;
  //self.ghost_next_block_x = 0;
  //self.ghost_next_block_z = 1; // testing end

  self.end_x = self.size * 18 - 18;
  self.end_z = self.size * 18 - 18;
  self.pieces = new Array(size);
  for (var i = 0; i < size; i++) {
    self.pieces[i] = new Array(size);
  }

  /*
   * getConnections - figures out which sides a current piece can have connections on
   *
   *  num - the type of piece in question
   *  result - the array containing the possible sides which pieces can connect
   *
   */

  self.resetMap = function () {
    scene.audio.play();
    self.player_x = 9;
    self.player_y = 0;
    self.player_z = 9;

    self.falling = false;
    self.size = size;
    self.ghost_x = self.size * 18 * 7;
    self.ghost_z = self.size * 18 * 7;
    self.ghost_block_x = self.size - 1;
    self.ghost_block_z = self.size - 1;
    self.ghost_next_block_x = self.size - 1;
    self.ghost_next_block_z = self.size - 2;
    self.ghost_step = 0;
    self.ghost_speed = 0.2;
    self.ghost_dir = 1;
    self.pieces = new Array(size);
    for (var i = 0; i < size; i++) {
      self.pieces[i] = new Array(size);
    }
    selectMap();
    scene.tx = 0;
    scene.tz = 0;
    scene.angle_x = 0;
    scene.angle_y = 0;

  };

  self.checkPositionForFalling = function () {
    if (self.player_x > size * 18 || self.player_z > size * 18 || self.player_x < 0 || self.player_z < 0 || self.pieces[Math.floor(self.player_x / 18)][Math.floor(self.player_z / 18)] == 0) {
      self.falling = true;
    }
  };


  self.moveGhost = function () {

    if (self.ghost_step < 18) {
      switch (self.ghost_dir) {

        case 1:

          self.ghost_z -= self.ghost_speed;

          break;
        case 2:

          self.ghost_x += self.ghost_speed;

          break;
        case 3:

          self.ghost_z += self.ghost_speed;

          break;

        case 4:

          self.ghost_x -= self.ghost_speed;

          break;
      }
      self.ghost_step += self.ghost_speed;
    } else {

      var array = getConnections(self.pieces[self.ghost_next_block_x][self.ghost_next_block_z]);
      var flag = true;
      var curDir = self.ghost_dir;
      self.ghost_block_x = self.ghost_next_block_x;
      self.ghost_block_z = self.ghost_next_block_z;
      while (flag) {

        self.ghost_dir = array[Math.floor(Math.random() * (array.length))];

        if (array.length == 1) {
          flag = false;
        } else {

          var mod = curDir - 3;

          if(mod<0){
            mod = mod+4;
          }


          if (self.ghost_dir != mod + 1) { //check to see if the ghost has turned around
            flag = false;
          }
        }
        if (!flag) {

          //set the new destination of the ghost
          if (self.ghost_dir == 1) {
            self.ghost_next_block_x = self.ghost_block_x;
            self.ghost_next_block_z = self.ghost_block_z - 1;
          } else if (self.ghost_dir == 2) {
            self.ghost_next_block_x = self.ghost_block_x + 1;
            self.ghost_next_block_z = self.ghost_block_z;
          } else if (self.ghost_dir == 3) {
            self.ghost_next_block_x = self.ghost_block_x;
            self.ghost_next_block_z = self.ghost_block_z + 1;
          } else if (self.ghost_dir == 4) {
            self.ghost_next_block_x = self.ghost_block_x - 1;
            self.ghost_next_block_z = self.ghost_block_z;
          }

          //check if the ghost is headed out of bounds
          if (self.ghost_next_block_x < 0 || self.ghost_next_block_x > self.size - 1 || self.ghost_next_block_z < 0 || self.ghost_next_block_z > self.size - 1) {
            flag = true;
            curDir = self.ghost_dir;
          }
        }

      }


      self.ghost_step = 0;
    }


    scene.render();
    checkDeath();
  };

  var checkDeath = function () {

    var centerToCenter = Math.sqrt(Math.pow(self.player_x - 9 - self.ghost_x, 2) + Math.pow(self.player_z - 9 - self.ghost_z, 2));

    if (centerToCenter < 5) {
      scene.audio.pause();
      alert("GAME OVER");
      self.resetMap();
    }


  };

  var getConnections = function (num) {

    var result;

    /* 1 = south
     *  2 = west
     *  3 = north
     *  4 = east
     */
    //map 1
    switch (num) {
      case 0:
        result = [1, 2, 3, 4];
        break;
      case 1:
        result = [1, 3];
        break;
      case 2:
        result = [2, 4];
        break;
      case 3:
        result = [1, 2, 4];
        break;
      case 4:
        result = [1, 2, 3];
        break;
      case 5:
        result = [2, 3, 4];
        break;
      case 6:
        result = [1, 3, 4];
        break;
      case 7:
        result = [1, 2];
        break;
      case 8:
        result = [2, 3];
        break;
      case 9:
        result = [3, 4];
        break;
      case 10:
        result = [1, 4];
        break;
      case 11:
        result = [1];
        break;
      case 12:
        result = [2];
        break;
      case 13:
        result = [3];
        break;
      case 14:
        result = [4];
        break;
      case 15:
        result = [1, 2, 3, 4];
        break;

    }

    return result;
  };

  var checkWin = function () {

    var playerToEnd = Math.sqrt(Math.pow(self.player_x - self.end_x, 2) + Math.pow(self.player_z - self.end_z, 2));

    if (playerToEnd < 15) {
      scene.audio.pause();
      alert("Congratulations! You won!");
      self.resetMap();
    }
  };

  var selectMap = function () {

    var num = 1;

    switch (num) {

      case 1:

        //map 1
        self.pieces =
          [[8, 7, 13, 4, 1, 7, 9, 7],
            [2, 2, 0, 2, 0, 2, 0, 2],
            [2, 5, 1, 3, 8, 6, 1, 3],
            [2, 2, 13, 10, 2, 8, 7, 2],
            [2, 9, 1, 1, 0, 10, 2, 2],
            [2, 8, 1, 1, 10, 8, 6, 3],
            [2, 9, 7, 0, 8, 3, 0, 9],
            [9, 11, 9, 1, 10, 9, 1, 11]];
        break;

    }


  };

  self.checkMovement = function (objX, objZ, tx, tz, curX, curZ) {

    var openings = getConnections(self.pieces[curX][curZ]);

    if (openings != null) {


      if (curX != Math.floor((objX + tx) / 18)) {
        if (tx < 0) {
          if (openings.indexOf(4) == -1) {
            return false;
          }
        } else {
          if (openings.indexOf(2) == -1) {
            return false;
          }
        }
      }
      if (curZ != Math.floor((objZ + tz) / 18)) {
        if (tz < 0) {
          if (openings.indexOf(1) == -1) {
            return false;
          }
        } else {
          if (openings.indexOf(3) == -1) {
            return false;
          }
        }
      }

    }
    checkWin();
    return true;
  };


  selectMap();


};


/* Pieces:
 *
 * first array location is the x-coordinate, second array location is the z-coordinate
 *
 * N-> negative z
 * W-> negative x
 * S-> positive z
 * E-> positive x
 *
 * 0: empty
 * 1: straight hallway, NS
 * 2: straight hallway, EW
 * 3: T-intersection, bottom of T is south
 * 4: T-intersection, bottom of T is west
 * 5: T-intersection, bottom of T is north
 * 6: T-intersection, bottom of T is east
 * 7: corner, opening SW
 * 8: corner, opening WN
 * 9: corner, opening NE
 * 10: corner, opening ES
 * 11: dead end, opening S
 * 12: dead end, opening W
 * 13: dead end, opening N
 * 14: dead end, opening E
 * 15: all open
 *
 */