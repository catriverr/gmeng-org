<center>
<h2>Gmeng Internals: Log</h2>
</center>

<hr>

### Log Implementation

The Gmeng Logger is a macro/function that has many different streams to log information when running the engine.
This is the definition in the source code:

```cpp
/// writes to a log file (&name) with content (&content)
static void __gmeng_write_log__(const std::string& name, const std::string& content, bool append = true) {
    Gmeng::outfile << content;
};


#include "types/termui.h"

namespace Gmeng {
    static t_display logc = {
        .pos = { .x=94, .y=2 },
        .v_cursor = 0,
        .v_outline_color = 1,
        .v_width = 100,
        .v_height = 40,
        .init=true,
        .v_textcolor = 2,
        .v_drawpoints=_ulogc_gen1dvfc(100*40),
        .title="gm:0/logstream"
    };
};

#define g_file __FILE__
#define g_delim ":"
#define g_line __LINE__

#define FILENAME (std::string(__FILE__).substr(std::string(__FILE__).rfind("/") + 1)).c_str()

#define __gmeng_attribute__() ({ \
    std::ostringstream oss; \
    oss << FILENAME << ":" << __LINE__; \
    oss.str(); \
})

static void _gm_log(const char* file, int line, std::string _msg, bool use_endl = true) {
    #ifndef __GMENG_ALLOW_LOG__
        __gmeng_write_log__("gmeng.log", "logging is disallowed");
        return;
    #endif
    #if __GMENG_ALLOW_LOG__ == true
        std::string msg = std::string(file) + ":" + v_str(line) + " | " + _msg;
        #if __GMENG_LOG_TO_COUT__ == true
            if (Gmeng::global.log_stdout) std::cout << msg << std::endl;
        #endif
        std::string _uthread = _uget_thread();
        std::string __vl_log_message__ =  "gm:" + _uthread + " *logger >> " + msg + (use_endl ? "\n" : "");
        Gmeng::logstream << __vl_log_message__;
        __gmeng_write_log__("gmeng.log", __vl_log_message__);
        if (Gmeng::global.dev_console) _utext(Gmeng::logc, __vl_log_message__);
        #if __GMENG_DRAW_AFTER_LOG__ == true
            if (Gmeng::global.dev_console) _udraw_display(Gmeng::logc);
        #endif
    #endif
};

static void gm_log(const char* file, int line, std::string _msg, bool use_endl = true) {
    if (Gmeng::global.shush) return;
    _gm_log(file, line, _msg, use_endl);
};

static void gm_log(std::string _msg, bool use_endl = true) {
    if (Gmeng::global.shush) return;
    _gm_log(":",0,_msg,use_endl);
};

static void gm_slog(Gmeng::color_t color, std::string title, std::string text) {
    if (Gmeng::global.shush) return;
    gm_log(":", 0, Gmeng::colors[color] + title + " " + Gmeng::colors[Gmeng::WHITE] + text);
};
```

All calls write to `_gm_log` with different parameters. `__FILE__` & `__LINE__` are to mark the lines where a log operation is being performed.

`gm_log` writes to the log, as a normal string.
`gm_slog` writes to the log as a specified logger, such as `gm_slog(YELLOW, "DEBUGGER", "debug data")`.

### TermUI Display

`gm_log` will pipe its output to a TermUI display if the definition for `__GMENG_DRAW_AFTER_LOG__` is enabled.

\* if a call to `patch_argv_global(int, char**)` is made from a program and the user specifies the `-shut-the-fuck-up` argument on the command-line logging will be disabled.

\* You may view different loggers and how to enable them from calling `patch_argv_global` from your program and running it with the `-help` argument.

<br>
