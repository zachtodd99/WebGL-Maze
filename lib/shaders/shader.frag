// Fragment shader program
precision mediump int;
precision mediump float;

// Light model
uniform vec3 u_Light_position;
uniform vec3 u_Light_color;
uniform float u_Shininess;
uniform vec3 u_Ambient_color;
// The texture unit to use for the color lookup
uniform sampler2D u_Sampler;
uniform vec3 u_Light_normal;
uniform float u_Light_angle;

// Data coming from the vertex shader
varying vec2 v_Texture_coordinate;

// Data coming from the vertex shader
varying vec3 v_Vertex;
varying vec4 v_Color;
varying vec3 v_Normal;

void main() {

  vec3 to_light;
  vec3 vertex_normal;
  float cos_angle;
  float distance;
  vec3 reflection;
  vec3 to_camera;
  vec3 diffuse_color;
  vec3 specular_color;
  vec3 ambient_color;
  vec3 color;
  vec4 initial_color;
  vec3 to_frag;
  float spotlight_angle;


  if (v_Texture_coordinate[0] == 0.0 && v_Texture_coordinate[1] == 0.0) {
    initial_color = v_Color;
  } else {
    initial_color = texture2D(u_Sampler, v_Texture_coordinate);
  }
// Calculate the ambient color as a percentage of the surface color


  to_frag = v_Vertex-u_Light_position;
  if(to_frag[2]<-150.0 || to_frag[2]>150.0){
    color=vec3(0.5,0.5,0.5)*vec3(initial_color);
    gl_FragColor = vec4(color, initial_color.a);
  }else{
  to_frag = normalize(to_frag);
  spotlight_angle = dot(to_frag, u_Light_normal);
  spotlight_angle = clamp(spotlight_angle, 0.0,1.0);

  ambient_color = u_Ambient_color * vec3(initial_color);


 // Calculate the ambient color as a percentage of the surface color
  ambient_color = u_Ambient_color * vec3(initial_color);

  // Calculate a vector from the fragment location to the light source
  to_light = u_Light_position - v_Vertex;
  distance = clamp(2.0*length(to_light)/50.0, 0.0, 2.0);
  to_light = normalize( to_light );

  // The vertex's normal vector is being interpolated across the primitive
  // which can make it un-normalized. So normalize the vertex's normal vector.
  vertex_normal = normalize( v_Normal );

  // Calculate the cosine of the angle between the vertex's normal vector
  // and the vector going to the light.
  cos_angle = dot(vertex_normal, to_light);
  cos_angle = clamp(cos_angle, 0.0, 1.0);

  // Scale the color of this fragment based on its angle to the light.
  diffuse_color = vec3(initial_color) * cos_angle;

  // Calculate the reflection vector
  reflection = 2.0 * dot(vertex_normal,to_light) * vertex_normal - to_light;

  // Calculate a vector from the fragment location to the camera.
  // The camera is at the origin, so negating the vertex location gives the vector
  to_camera = -1.0 * v_Vertex;

  // Calculate the cosine of the angle between the reflection vector
  // and the vector going to the camera.
  reflection = normalize( reflection );
  to_camera = normalize( to_camera );
  cos_angle = dot(reflection, to_camera);
  cos_angle = clamp(cos_angle, 0.0, 1.0);
  cos_angle = pow(cos_angle, u_Shininess);

  // The specular color is from the light source, not the object
//                          if (cos_angle > 0.0) {
//                            specular_color = u_Light_color * cos_angle;
//                            diffuse_color = diffuse_color * (1.0 - cos_angle);
//                          } else {
//                            specular_color = vec3(0.0, 0.0, 0.0);
//                          }
  float difference = ((1.0-spotlight_angle)/0.2);
  color = (ambient_color + diffuse_color)/distance;
  color = vec3(color.r-difference, color.g-difference, color.b-difference);


  gl_FragColor = vec4(color, initial_color.a);
}
}
