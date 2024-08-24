<center>
<h2>Getting Started with Gmeng</h2>
</center>
<hr/>

### Including Gmeng
Clone the repository with `git clone https://github.com/catriverr/gmeng-sdk`. Move the files to your includes directory.

```sh
mkdir ./include
mv -r ./gmeng-sdk/lib ./include/gmeng
```

Note that you need to pass the `-Iinclude` parameter to the `$(CXXFLAGS)` variable in your makefile

Include the engine source with:

```cpp
#include <gmeng/gmeng.h>
```

You can also define the flags gmeng uses before including the library,

#### Example 1: Flags

```cpp
#define GMENG_NO_CURSES true
#include <gmeng/gmeng.h>
/// this will disable the inclusion of <gmeng/types/interface.h> and <gmeng/src/interface.cpp>
```

### Creating a Game Development Environment
It is suggested to use the Gmeng 4.0\_glvl Framework when building games, as the alternative (Gmeng 1.1\_gm) is deprecated.
This framework is built with Textures, Models, Levels, Cameras and Viewpoints.
However, if your game is going to take place in a small, 2d skybox with nothing like models or textures being required, the 1.1 framework can still be used.
Refer to <gdoc onclick="setinput('Gmeng 1.1 Framework')">this document</gdoc> for the documentation of the 1.1 Framework.
<br>

#### Example 2: Environment

```cpp
#define __GMENG_LOG_TO_COUT__ false /// you may set this to true if you would like to see logs in the console.
#include <gmeng.h>
#include <iostream>
#include <vector>

using Gmeng::color_t, Gmeng::colors;

/// concatenate long function name (for documentation visibility purposes only)
using get_level_renderscale = Gmeng::_vget_renderscale2dpartial_scalar;

int main(int argc, char** argv) {
    patch_argv_global(argc, argv);      // patch the Gmeng::global parameters
                                        // not doing this will disable any cli parameters for debugging

    Gmeng::Level myLevel;               // create a Level object, this is the class that runs your game.
    myLevel.load_level("map.glvl");     // Load a level from a level file. Build with the editor ( gmeng -editor GLVL )
    myLevel.display.viewpoint = {       // diameters of the camera, dp1 until dp2
        { 0,0 }, { 50, 50 }             // dp1 cannot be lower than 0,0 and dp2 cannot be higher than your level's skybox diameters
    },
    myLevel.display.set_resolution(     // set the resolution. Different from the camera diameters.
        50, 50                          // this method sets the size of the camera's unit container
    );
    lvl.display.camera.set_modifier(    // set the modifier to draw with 1x1 sized pixels
        "cubic_render", 1               // this modifier transforms each unit into
    );                                  // half a monospace character with the top being the
                                        // foreground color while the bottom is the background.
    std::vector<gmeng::Unit> units =    // gets a renderscale of the entire level, with all of its chunks.
  get_level_renderscale(myLevel, true); // a big image of the entire level, to be sliced with camera functions
    std::string level_view =            // string of the units that are within the camera's view
  Gmeng::get_lvl_view(myLevel, units);  // in string type because it will be written to the console.
    Gmeng::emplace_lvl_camera(          // Writes all raw display units to the camera's unit vector
        myLevel, level_view             // no requirements for update() since they are already rendered
    );
    lvl.display.camera.clear_screen();  // clear the screen for visibility
    cout << lvl.display.camera.draw();  // draw the game view to the console screen
    cout << '\n';                       // newline for visibility
};
```

This code creates an image, compiles it into console characters and renders it to the screen. 
you need to place this in a `for loop` to render it continuously. This code will exit once one frame is rendered.

Here's a shorter version of this code that can be placed into a for loop.

```cpp
#include <gmeng.h>
#include <iostream>
#include <vector>

using Gmeng::color_t, Gmeng::colors;
using get_level_renderscale = gmeng::_vget_renderscale2dpartial_scalar;

int main(int argc, char** argv) {
    patch_argv_global(argc, argv);

    Gmeng::Level myLevel;
    myLevel.load_level("map.glvl");
    myLevel.display.viewpoint = { {0,0}, {50,50} };
    myLevel.display.set_resolution(50, 50);
    myLevel.display.camera.set_modifier("cubic_render", 1);
    
    std::vector<gmeng::Unit> units = get_level_renderscale(myLevel, true);
    for (;;) {
        std::string level_view = Gmeng::get_lvl_view(myLevel, units);
        Gmeng::emplace_lvl_camera(myLevel, view);
        lvl.display.camera.clear_screen();
        cout << lvl.display.camera.draw() << '\n';
    };
};
```

This code will continuously output frames to the camera. However since there is no difference between the frames, they will be identical.

When your program starts running, the internal `gm\_log()` method will generate a `gmeng.log` and a `gmeng-functree.log` file.
These are for internal logging and debugging purposes, but you can implement your own function calls and internal logs in your program as well.

Refer to the <gdoc onclick="setinput('functree_call')">Functree Call</gdoc> and <gdoc onclick="setinput('gm_log')">Log</gdoc> documents for their usage.

### Extending The Program Functionality
Your code can be built by running the `gmeng -compile file.cpp [g++ parameters]` command. If you do not know which parameters you need to set, you may leave it blank as `gmeng -compile file.cpp` and it will be compiled.

\* You may add a `-DGMENG_NO_CURSES` clang parameter to disable including `interface` functionality, which uses ncurses.
Gmeng, by default, does not use ncurses for its interface rendering, these methods are for the editors.

\* These methods can reduce performance.

<br>
