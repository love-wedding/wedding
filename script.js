(function () {
    if (typeof performance === "undefined" || typeof Function !== "function") return;
    var n = 0;
    function f() {
        var h = document.hidden, t = performance.now();
        try {
            Function("debugger")()
        } catch (e) {
            return
        }
        var d = performance.now() - t;
        if (!h && !document.hidden && d > 100) {
            if (d > 1000 || ++n >= 2) {
                try {
                    var r = window.taothiepRum;
                    if (r && typeof r.reportDevtools === "function") r.reportDevtools(10)
                } catch (e) {}
                try {
                    window.stop()
                } catch (e) {}
                location.replace("https://www.google.com/search?q=abc");
                return
            }
        } else {
            n = 0
        }
        setTimeout(f, 500)
    }
    f()
})();