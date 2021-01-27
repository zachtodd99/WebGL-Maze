/**
 * obj_to_arrays.js, By Wayne Brown, Spring 2016
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
/**
 * An object that contains a set of points and their color, suitable for
 * rendering using gl.POINTS mode.
 * @constructor
 */
function PointsData() {
  var self = this;
  self.vertices = [];   // a Float32Array; 3 components per vertex (x,y,z)
  self.colors = [];     // a Float32Array; 3 components per vertex RGB
  self.material = null; // a Material object
}

//-------------------------------------------------------------------------
/**
 * An object that contains a set of lines and their colors, suitable for
 * rendering using gl.LINES mode.
 * @constructor
 */
function LinesData() {
  var self = this;
  self.vertices = [];   // a Float32Array; 3 components per vertex (x,y,z)
  self.colors = [];   // a Float32Array; 3 components per vertex RGB
  self.textures = [];   // a Float32Array; 1 component per vertex
  self.material = null; // a Material object
}

//-------------------------------------------------------------------------
/**
 * A collection of triangles that can all be rendered using gl.TRIANGLES.
 * @constructor
 */
function TrianglesData() {
  var self = this;
  self.vertices = [];       // a Float32Array; 3 components per vertex (x,y,z)
  self.colors = [];         // a Float32Array; 3 components per vertex RGB
  self.flat_normals = [];   // a Float32Array; 3 components per vertex <dx,dy,dz>
  self.smooth_normals = []; // a Float32Array; 3 components per vertex <dx,dy,dz>
  self.textures = [];       // a Float32Array; 2 components per vertex (s,t)
  self.material = null;     // a Material object
}

//-------------------------------------------------------------------------
/**
 * Definition of an object that stores arrays of data for one model. A model
 * can contain points, lines, and triangles.
 * @constructor
 */
function ModelArrays(name) {
  var self = this;
  self.name = name;     // The name of this model
  self.points = null;   // a PointsData object, if the model contains points
  self.lines = null;    // a LinesData object, if the model contains lines
  self.triangles = null;// a TrianglesData object, it the model contains triangles
}

//-------------------------------------------------------------------------
/**
 * The definition of a material surface Object.
 * @param material_name
 * @constructor
 */
function ModelMaterial(material_name) {
  var self = this;
  self.name = material_name;
  self.index = -1;   // matches a material to an array index.
  self.Ns = null;    // the specular exponent for the current material
  self.Ka = null;    // the ambient reflectivity using RGB values
  self.Kd = null;    // the diffuse reflectivity using RGB values
  self.Ks = null;    // the specular reflectivity using RGB values
  self.Ni = null;    // the optical density for the surface; index of refraction
  self.d = null;     // the dissolve for the current material; transparency
  self.illum = null; // illumination model code
  self.map_Kd = null;// specifies a color texture filename
  self.textureMap = null; // the image used for a texture map
}

//-------------------------------------------------------------------------
/**
 * Parse a line of text and extract data values.
 * @constructor
 */
var StringParser = function () {
  var self = this;
  // The string to parse.
  self.str = null;
  // The current position in the string to be processed.
  self.index = 0;

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Initialize StringParser object
  self.init = function (str) {
    self.str = str;
    self.index = 0;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.restart = function () {
    self.index = 0;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.isDelimiter = function (c) {
    return (
      c === ' ' ||
      c === '\t' ||
      c === '(' ||
      c === ')' ||
      c === '"' ||
      c === "'"
    );
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.skipDelimiters = function () {
    while (self.index < self.str.length &&
    self.isDelimiter(self.str.charAt(self.index))) {
      self.index += 1;
    }
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.getWordLength = function (start) {
    var i = start;
    while (i < self.str.length && !self.isDelimiter(self.str.charAt(i))) {
      i += 1;
    }
    return i - start;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.skipToNextWord = function () {
    self.skipDelimiters();
    self.index += (self.getWordLength(self.index) + 1);
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.getWord = function () {
    var n, word;
    self.skipDelimiters();
    n = self.getWordLength(self.index);
    if (n === 0) {
      return null;
    }
    word = self.str.substr(self.index, n);
    self.index += (n + 1);

    return word.trim();
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.getInt = function () {
    var word = self.getWord();
    if (word) {
      return parseInt(word, 10);
    }
    return null;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.getFloat = function () {
    var word = self.getWord();
    if (word) {
      return parseFloat(word);
    }
    return null;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // Parses next 'word' into a series of integers.
  // Assumes the integers are separated by a slash (/).
  self.getIndexes = function (indexes) {
    var j, word, indexesAsStrings;
    word = self.getWord();
    if (word) {
      // The face indexes are vertex/texture/normal
      // The line indexes are vertex/texture
      indexes[0] = -1;
      indexes[1] = -1;
      indexes[2] = -1;

      indexesAsStrings = word.split("/");
      for (j = 0; j < indexesAsStrings.length; j += 1) {
        indexes[j] = parseInt(indexesAsStrings[j], 10);
        if (isNaN(indexes[j])) {
          indexes[j] = -1;
        }
      }
      return true;
    }
    return false;
  };

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  self.getRestOfLine = function () {
    return self.str.substr(self.index).trim();
  };

};

//-------------------------------------------------------------------------
/**
 * Given an OBJ text model description, convert the data into 1D arrays
 * that can be rendered in WebGL.
 * @param model_description String Contains the model data.
 * @param materials_dictionary Dictionary of material objects.
 * @param out An object that knows where to display output messages
 * @return Object A set of ModelArray objects accessible by name or index.
 */
function createModelsFromOBJ(model_description, materials_dictionary, out) {

  // The return value is an object; each property of the object is a unique
  // ModelArrays object. The property name comes from the model's name.
  var model_dictionary = {};
  var number_models = 0;

  // Arrays of values common to all the models in the model_description
  // All arrays have an empty entry in index 0 because OBJ indexes start at 1.
  var all_vertices = [[]];
  var all_colors = null;
  var all_normals = [[]];
  var avg_normals = null;
  var all_texture_coords = [[]];

  // The current model being defined. An OBJ file can define more than one model.
  var current_model = null; // An instance of ModelArrays.

  // The active state.
  var smooth_shading = false;
  var material_name = null;
  var color_index = 0;

  // Scratch variables for collecting data
  var start_line_indexes = new Array(3);
  var end_line_indexes = new Array(3);
  var vector = new Learn_webgl_vector3();
  var vertex_indexes = new Array(3);

  // Line segments to render the normal vectors can be created
  var create_visible_normals = false;

  //-----------------------------------------------------------------------
  function _getColorsFromMaterials() {
    var material, name, number_colors, index;
    if (Object.keys(materials_dictionary).length > 0) {
      number_colors = Object.keys(materials_dictionary).length;
      all_colors = new Array(number_colors);
      for (name in materials_dictionary) {
        material = materials_dictionary[name];
        if (material.hasOwnProperty('Kd')) {
          index = material.index;
          all_colors[index] = material.Kd;
        }
      }
    }
  }

  //-----------------------------------------------------------------------
  function _parsePoints(sp) {
    var index;

    if (current_model.points === null) {
      current_model.points = new PointsData();
      current_model.points.material = materials_dictionary[material_name];
    }

    // Get the indexes of the vertices that define the point(s)
    index = sp.getWord();
    while (index) {
      // Add a point to the model definition
      current_model.points.vertices.push(index);
      current_model.points.colors.push(color_index);

      index = sp.getWord();
    }
  }

  //-----------------------------------------------------------------------
  function _parseLines(sp) {

    if (current_model.lines === null) {
      current_model.lines = new LinesData();
      current_model.lines.material = materials_dictionary[material_name];
    }

    // Get the indexes of the vertices that define the point(s)
    sp.getIndexes(start_line_indexes);
    while (sp.getIndexes(end_line_indexes)) {
      // Add a line to the model definition
      current_model.lines.vertices.push(start_line_indexes[0]);
      current_model.lines.vertices.push(end_line_indexes[0]);
      current_model.lines.colors.push(color_index);
      current_model.lines.colors.push(color_index);
      if (start_line_indexes[1] !== null && start_line_indexes[1] >= 0) {
        current_model.lines.textures.push(start_line_indexes[1]);
        current_model.lines.textures.push(end_line_indexes[1]);
      }

      start_line_indexes[0] = end_line_indexes[0];
      start_line_indexes[1] = end_line_indexes[1];
    }
  }

  //-----------------------------------------------------------------------
  function _parseFaces(sp) {
    var index_list, numberTriangles, triangles, n, edge1, edge2,
      normal, normal_index;

    if (current_model.triangles === null) {
      current_model.triangles = new TrianglesData();
      current_model.triangles.material = materials_dictionary[material_name];
    }

    triangles = current_model.triangles;

    // Get the indexes of the vertices that define the face
    index_list = [];
    while (sp.getIndexes(vertex_indexes)) {
      index_list.push(vertex_indexes.slice());
    }

    // Create the face triangles.
    numberTriangles = index_list.length - 2;
    n = 1;
    while (n <= numberTriangles) {
      // Add a triangle to the model definition
      triangles.vertices.push(index_list[0][0]);
      triangles.vertices.push(index_list[n][0]);
      triangles.vertices.push(index_list[n + 1][0]);

      triangles.colors.push(color_index);
      triangles.colors.push(color_index);
      triangles.colors.push(color_index);

      if (index_list[0][1] > -1) {
        triangles.textures.push(index_list[0][1]);
        triangles.textures.push(index_list[n][1]);
        triangles.textures.push(index_list[n + 1][1]);
      }

      // The normal vectors are set:
      // If normal vectors are included in the OBJ file: use the file data
      // If normal vectors not in OBJ data:
      //   the flat_normal is set to the calculated face normal.
      //   the smooth_normals is set to an average normal if smoothing is on.
      if (index_list[0][2] === -1) {
        // There was no normal vector in the OBJ file; calculate a normal vector
        // using a counter-clockwise vertex winding.
        // Only calculate one normal for faces with more than 3 vertices
        if (n === 1) {
          edge1 = vector.createFrom2Points(all_vertices[index_list[0][0]], all_vertices[index_list[n][0]]);
          edge2 = vector.createFrom2Points(all_vertices[index_list[n][0]], all_vertices[index_list[n + 1][0]]);
          normal = new Float32Array(3);
          vector.crossProduct(normal, edge1, edge2);
          vector.normalize(normal);

          all_normals.push(normal);
          normal_index = all_normals.length - 1;
        }

        triangles.flat_normals.push(normal_index);
        triangles.flat_normals.push(normal_index);
        triangles.flat_normals.push(normal_index);

        if (smooth_shading) {
          // These indexes point to the vertex so the average normal vector
          // can be accessed later
          triangles.smooth_normals.push(-index_list[0][0]);
          triangles.smooth_normals.push(-index_list[n][0]);
          triangles.smooth_normals.push(-index_list[n + 1][0]);
        } else {
          triangles.smooth_normals.push(normal_index);
          triangles.smooth_normals.push(normal_index);
          triangles.smooth_normals.push(normal_index);
        }
      } else {
        // Use the normal vector from the OBJ file
        triangles.flat_normals.push(index_list[0][2]);
        triangles.flat_normals.push(index_list[n][2]);
        triangles.flat_normals.push(index_list[n + 1][2]);

        triangles.smooth_normals.push(index_list[0][2]);
        triangles.smooth_normals.push(index_list[n][2]);
        triangles.smooth_normals.push(index_list[n + 1][2]);
      }
      n += 1; // if there is more than one triangle
    }
  }

  //-----------------------------------------------------------------------
  function _parseObjLines() {
    var sp, lines, which_line, command, model_name,
      current_material_file, vertices, x, y, z,
      dot_position, dx, dy, dz, u, v, coords, normal;

    // Create StringParser
    sp = new StringParser();

    // Break up the input into individual lines of text.
    lines = model_description.split('\n');

    // The vertices are broken into sections for each model, but face
    // indexes for vertices are global for the entire vertex list.
    // Therefore, keep a single list of vertices for all models.
    vertices = [];
    // OBJ vertices are indexed starting at 1 (not 0).
    vertices.push([]);  // empty vertex for [0].

    for (which_line = 0; which_line < lines.length; which_line += 1) {

      sp.init(lines[which_line]);

      command = sp.getWord();

      if (command) {

        switch (command) {
          case '#':
            break; // Skip comments

          case 'mtllib': // Save the material data filename for later retrieval
            current_material_file = sp.getWord();
            // Remove the filename extension
            dot_position = current_material_file.lastIndexOf('.');
            if (dot_position > 0) {
              current_material_file = current_material_file.substr(0, dot_position);
            }
            break;

          case 'usemtl': // Material name - following elements have this material
            material_name = sp.getWord();
            if(materials_dictionary[material_name] != undefined){
              color_index = materials_dictionary[material_name].index;
            }
            break;

          case 'o':
          case 'g': // Read Object name and create a new ModelArrays
            model_name = sp.getWord();
            current_model = new ModelArrays(model_name);

            // Allow the models to be accesses by index or name
            model_dictionary[model_name] = current_model;
            model_dictionary[number_models] = current_model;
            number_models += 1;
            break;

          case 'v':  // Read vertex
            x = sp.getFloat();
            y = sp.getFloat();
            z = sp.getFloat();
            all_vertices.push(new Float32Array([x, y, z]));
            break;

          case 'vn':  // Read normal vector
            dx = sp.getFloat();
            dy = sp.getFloat();
            dz = sp.getFloat();
            normal = new Float32Array([dx, dy, dz]);
            vector.normalize(normal);
            all_normals.push(normal);
            break;

          case 'vt':  // Read texture coordinates; only 1D or 2D
            u = sp.getFloat();
            v = sp.getFloat();
            if (v === null) {
              coords = new Float32Array([u]);
            } else {
              coords = new Float32Array([u, v]);
            }
            all_texture_coords.push(coords);
            break;

          case 'p':  // Read one or more point definitions
            _parsePoints(sp);
            break;

          case 'l':  // Read one or more line definitions
            _parseLines(sp);
            break;

          case 'f': // Read a face, which may contain multiple triangles
            _parseFaces(sp);
            break;

          case 's': // smooth shading flag
            smooth_shading = !(sp.getWord() === 'off');
            break;

        } // end switch
      } // end of if (command)
    }// end looping over each line

    model_dictionary.number_models = number_models;
  }

  //-----------------------------------------------------------------------
  function _calculateSmoothNormals() {
    var j, k, model, triangles;
    var count_normals, used, vertex_index, normal_index;

    if (model_dictionary.number_models > 0) {

      avg_normals = new Array(all_vertices.length);
      count_normals = new Array(all_vertices.length);
      used = new Array(all_vertices.length);

      for (j = 0; j < all_vertices.length; j += 1) {
        avg_normals[j] = new Float32Array([0, 0, 0]);
        count_normals[j] = 0;
        used[j] = [];
      }

      for (j = 0; j < model_dictionary.number_models; j += 1) {
        model = model_dictionary[j];

        if (model.triangles !== null) {
          triangles = model.triangles;

          // For every vertex, add all the normals for that vertex and count
          // the number of triangles. Only use a particular normal vector once.
          for (k = 0; k < triangles.vertices.length; k += 1) {
            vertex_index = triangles.vertices[k];
            normal_index = triangles.flat_normals[k];

            if ($.inArray(normal_index, used[vertex_index]) < 0) {
              used[vertex_index].push(normal_index);
              count_normals[vertex_index] += 1;
              avg_normals[vertex_index][0] += all_normals[normal_index][0];
              avg_normals[vertex_index][1] += all_normals[normal_index][1];
              avg_normals[vertex_index][2] += all_normals[normal_index][2];
            }
          }

          // Divide by the count values to get an average normal
          for (k = 0; k < avg_normals.length; k += 1) {
            if (count_normals[k] > 0) {
              avg_normals[k][0] /= count_normals[k];
              avg_normals[k][1] /= count_normals[k];
              avg_normals[k][2] /= count_normals[k];
              vector.normalize(avg_normals[k]);
           }
          }
        }
      }
    }

  }

  //-----------------------------------------------------------------------
  function _indexesToValues(indexes, source_data, n_per_value) {
    var j, k, n, array, size, index;

    if (source_data.length <= 0) {
      return null;
    } else {
      size = indexes.length * n_per_value;
      array = new Float32Array(size);
      n = 0;
      for (j = 0; j < indexes.length; j += 1) {
        index = indexes[j];

        for (k = 0; k < n_per_value; k += 1, n += 1) {
          array[n] = source_data[index][k];
        }
      }
      return array;
    }
  }

  //-----------------------------------------------------------------------
  function _smoothNormalIndexesToValues(indexes) {
    var j, k, n, array, size, index;

    if (indexes.length <= 0) {
      return null;
    } else {
      size = indexes.length * 3;
      array = new Float32Array(size);
      n = 0;
      for (j = 0; j < indexes.length; j += 1) {
        index = indexes[j];

        if (index >= 0) {
          for (k = 0; k < 3; k += 1, n += 1) {
            array[n] = all_normals[index][k];
          }
        } else {
          index = -index;
          for (k = 0; k < 3; k += 1, n += 1) {
            array[n] = avg_normals[index][k];
          }
        }
      }
      return array;
    }
  }

  //-----------------------------------------------------------------------
  function _convertIndexesIntoValues() {
    var j, model, points, lines, triangles;
    for (j = 0; j < model_dictionary.number_models; j += 1) {
      model = model_dictionary[j];

      if (model.points !== null) {
        points = model.points;
        points.vertices = _indexesToValues(points.vertices, all_vertices, 3);
        points.colors = _indexesToValues(points.colors, all_colors, 3);
      }

      if (model.lines !== null) {
        lines = model.lines;
        lines.vertices = _indexesToValues(lines.vertices, all_vertices, 3);
        lines.colors = _indexesToValues(lines.colors, all_colors, 3);
        lines.textures = _indexesToValues(lines.textures, all_texture_coords, 1);
      }

      if (model.triangles !== null) {
        triangles = model.triangles;
        triangles.vertices = _indexesToValues(triangles.vertices, all_vertices, 3);
        triangles.colors = _indexesToValues(triangles.colors, all_colors, 3);
        triangles.flat_normals = _indexesToValues(triangles.flat_normals, all_normals, 3);
        triangles.smooth_normals = _smoothNormalIndexesToValues(triangles.smooth_normals);
        triangles.textures = _indexesToValues(triangles.textures, all_texture_coords, 2);
      }
    }
  }

  //-----------------------------------------------------------------------
  function _createVisibleNormals() {
    var j, n, model, v1x, v1y, v1z, v2x, v2y, v2z, v3x, v3y, v3z;
    var n1x, n1y, n1z, n2x, n2y, n2z, n3x, n3y, n3z;
    var number_triangles, vertices, flat_normals, normals;
    var number_vertices, smooth_normals, normals2;

    for (j = 0; j < model_dictionary.number_models; j += 1) {
      model = model_dictionary[j];

      if (model.triangles.flat_normals.length > 0) {
        // For every triangle, create one normal vector starting at the
        // center of the face.
        vertices = model.triangles.vertices;
        number_triangles = vertices.length / 3 / 3;
        flat_normals = model.triangles.flat_normals;
        normals = new Float32Array(number_triangles * 6);
        for (j = 0, n = 0; j < vertices.length; j += 9, n += 6) {
          v1x = vertices[j];
          v1y = vertices[j+1];
          v1z = vertices[j+2];

          v2x = vertices[j+3];
          v2y = vertices[j+4];
          v2z = vertices[j+5];

          v3x = vertices[j+6];
          v3y = vertices[j+7];
          v3z = vertices[j+8];

          normals[n  ] = (v1x + v2x + v3x) / 3;
          normals[n+1] = (v1y + v2y + v3y) / 3;
          normals[n+2] = (v1z + v2z + v3z) / 3;

          n1x = flat_normals[j];
          n1y = flat_normals[j+1];
          n1z = flat_normals[j+2];

          n2x = flat_normals[j+3];
          n2y = flat_normals[j+4];
          n2z = flat_normals[j+5];

          n3x = flat_normals[j+6];
          n3y = flat_normals[j+7];
          n3z = flat_normals[j+8];

          normals[n+3] = normals[n  ] + n1x;
          normals[n+4] = normals[n+1] + n1y;
          normals[n+5] = normals[n+2] + n1z;
        }

        model.triangles.render_flat_normals = normals;
      }

      if (model.triangles.smooth_normals.length > 0) {
        // For every vertex, create one normal vector starting at the vertex
        vertices = model.triangles.vertices;
        number_vertices = vertices.length / 3;
        smooth_normals = model.triangles.smooth_normals;
        normals2 = new Float32Array(number_vertices * 6);
        for (j = 0, n = 0; j < vertices.length; j += 3, n += 6) {
          normals2[n  ] = vertices[j];
          normals2[n+1] = vertices[j+1];
          normals2[n+2] = vertices[j+2];

          normals2[n+3] = vertices[j]   + smooth_normals[j];
          normals2[n+4] = vertices[j+1] + smooth_normals[j+1];
          normals2[n+5] = vertices[j+2] + smooth_normals[j+2];
        }

        model.triangles.render_smooth_normals = normals2;
      }
    }
  }

  //------------------------------------------------------------------------
  // body of create_model_from_obj()

  if (!model_description) {
    out.displayError('Model data for ' + model_description + ' is empty.');
    return [null, null];
  }

  _getColorsFromMaterials();
  _parseObjLines();
  _calculateSmoothNormals();
  _convertIndexesIntoValues();
  if (create_visible_normals) {
    _createVisibleNormals();
  }

  // Display the models that were created to the console window.
  // This can be comments out if you don't want the confirmation.
  var num;
  for (num = 0; num < model_dictionary.number_models; num += 1) {
    out.displayInfo('Created model: ' + model_dictionary[num].name);
  }

  return model_dictionary;
}

//=========================================================================
// Given an OBJ model description, retrieve any references to MTL files.
//=========================================================================
/**
 * Find any "material properties" file references in an OBJ data file.
 * @param model_description String OBJ text description.
 * @return Array A list of MTL file names.
 */
function getMaterialFileNamesFromOBJ(model_description) {
  var sp, lines, which_line, command, material_filename_list;

  material_filename_list = [];

  // Create StringParser
  sp = new StringParser();

  // Break up the input into individual lines of text.
  lines = model_description.split('\n');

  for (which_line = 0; which_line < lines.length; which_line += 1) {

    sp.init(lines[which_line]);
    command = sp.getWord();

    if (command === 'mtllib') {
      material_filename_list.push(sp.getWord());
    }
  }

  return material_filename_list;
}

//=========================================================================
// Create material properties for a model from an MTL file.
//=========================================================================
/**
 * For OBJ model definitions, material properties are defined in a separate
 * file. This class will parse the text data in an MTL file and return
 * a dictionary of material properties. A material name is the key into
 * the dictionary.
 *
 * @param data_string String The text of a MTL file.
 * @returns Object { materialName: ModelMaterial }
 */
function createObjModelMaterials(data_string) {

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function _parseRGB(sp) {
    var color;

    color = new Float32Array(4);

    color[0] = sp.getFloat();
    color[1] = sp.getFloat();
    color[2] = sp.getFloat();
    color[3] = sp.getFloat();

    // If there was just one value, the value is repeated for each component
    if (color[1] === null) {
      color[1] = color[0];
    }
    if (color[2] === null) {
      color[2] = color[0];
    }

    // if there was no alpha value, make the color opaque.
    if (color[3] === null) {
      color[3] = 1.0;
    }

    return color;
  }

  //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var lineIndex, sp, command, lines, dot_position;
  var material_name, current_material, material_index;
  var material_dictionary = {}; // Empty object

  current_material = null;
  material_index = 0;

  // Break up into lines and store them as array
  lines = data_string.split('\n');

  sp = new StringParser();

  for (lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {

    sp.init(lines[lineIndex]);

    command = sp.getWord();

    if (command) {

      switch (command) {
        case '#':  // Skip comments
          break;

        case 'newmtl':  // Start a new material definition.
          material_name = sp.getWord();
          // Remove the filename extension
          dot_position = material_name.lastIndexOf('.');
          if (dot_position > 0) {
            material_name = material_name.substr(0, dot_position);
          }

          current_material = new ModelMaterial(material_name);
          current_material.index = material_index;
          material_index += 1;
          material_dictionary[material_name] = current_material;
          break;

        case 'Ns':  //
          current_material.Ns = sp.getFloat();
          break;

        case 'Ka':  // Read the ambient color
          current_material.Ka = _parseRGB(sp);
          break;

        case 'Kd':  // Read the diffuse color
          current_material.Kd = _parseRGB(sp);
          break;

        case 'Ks':  // Read the specular color
          current_material.Ks = _parseRGB(sp);
          break;

        case 'Ni':  // Read the specular color
          current_material.Ni = sp.getFloat();
          break;

        case 'd':  // Read the ???
          current_material.illum = sp.getFloat();
          break;

        case 'illum':  // Read the illumination coefficient
          current_material.illum = sp.getInt();
          break;

        case 'map_Kd': // Read the name of the texture map image
          current_material.map_Kd = sp.getRestOfLine();
          break;
      } // end switch
    }
  } // end for-loop for processing lines

  return material_dictionary;
}
