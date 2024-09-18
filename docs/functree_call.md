<center>
<h2>Gmeng Internals: Functree</h2>
</center>

<hr>

### Functree Implementation

Functree is a function call tracker utility in the Gmeng library. It writes saves function call trees with the filename, line number and function name parameters to the `$(CWD)/gmeng-functree.log` file.
This is the definition in the source code:

```cpp
#define vl_get_name(x) #x
#define vl_filename(path) (strrchr(path, '/') ? strrchr(path, '/') + 1 : path)

namespace Gmeng {
    static std::map<std::string, std::string> func_annotations;
    static std::ofstream funclog("gmeng-functree.log");
    static bool functree_init = false;
    static bool functree_enabled = true;
    static std::vector<std::string> func_last;
};

static void _func_annot(const char* func, const char* info) {
    Gmeng::func_annotations.emplace(func, std::string(info));
};

#define __annot__(func, info)      _func_annot(vl_get_name(func), info)
#define __info__                   __annot__
#define __annotation__             __annot__

#define __functree_init__() if (!Gmeng::functree_init) Gmeng::funclog << "-- cleared previous log --\n~~GMENG_FUNCTREE~~\n*** This file is used for diagnostics ***\n", Gmeng::functree_init = true

static void _functree_vl(char* file, int line, const char* func, char* pretty_func) {
    if (!Gmeng::functree_enabled) return;
    if (!Gmeng::functree_init) __functree_init__();
    std::string func_annot = "";
    auto v = Gmeng::func_annotations.find(func);
    if (v != Gmeng::func_annotations.end()) func_annot = "\t\t/// " + v->second;
    std::string dat = vl_filename(file) + std::string(":") + std::to_string(line) + " >> " + func + func_annot;
    Gmeng::funclog << dat << std::endl;
    if (Gmeng::func_last.size() >= Gmeng::func_last.max_size()) Gmeng::func_last.clear();
    Gmeng::func_last.push_back(dat);
};

#define __functree_call__( func) _functree_vl(__FILE__, __LINE__, vl_get_name(func), __PRETTY_FUNCTION__)
```

The Functree will also log annotations for functree calls with `__annot__(char* func, char*)`

### Implementing a Functree Tracker to Your Program

You can call the macro from your methods to register it is a functree tracked method.

```cpp
int main(int argc, char** argv) {
    __annot__(main, 'entry point to my program');
    __functree_call__(main);
};
```

set `Gmeng::functree_enabled` to `false` to disable this system.

<br>
