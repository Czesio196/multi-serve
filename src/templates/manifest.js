(() => {
    "use strict";
    var e = {};
    (e.g = (function () {
        if ("object" == typeof globalThis) return globalThis;
        try {
            return this || new Function("return this")();
        } catch (e) {
            if ("object" == typeof window) return window;
        }
    })()),
        (() => {
            var t;
            e.g.importScripts && (t = e.g.location + "");
            var n = e.g.document;
            if (!t && n && (n.currentScript && (t = n.currentScript.src), !t)) {
                var a = n.getElementsByTagName("script");
                if (a.length)
                    for (var i = a.length - 1; i > -1 && !t; ) t = a[i--].src;
            }
            if (!t)
                throw new Error(
                    "Automatic publicPath is not supported in this browser"
                );
            (t = t
                .replace(/#.*$/, "")
                .replace(/\?.*$/, "")
                .replace(/\/[^\/]+$/, "/")),
                (e.p = t);
        })();
    var t = <<MANIFEST>>;
    function n(e) {
        e = e.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var t = new RegExp("[\\?&]" + e + "=([^&#]*)").exec(
            window.location.search
        );
        return null === t ? "" : decodeURIComponent(t[1].replace(/\+/g, " "));
    }
    var a = {
        _metadata: undefined,
        getManifests: function () {
            var a = JSON.parse(JSON.stringify(t), function (e, t) {
                    if ("paths" === e) {
                        for (
                            var n = t, a = {}, i = 0, r = Object.entries(n.l);
                            i < r.length;
                            i++
                        ) {
                            var o = r[i],
                                s = o[0],
                                c = o[1],
                                d = void 0,
                                l = void 0,
                                u = !1,
                                f = void 0;
                            "string" == typeof c
                                ? (l = c)
                                : ((u = !0), (l = c[0]), (f = c[1])),
                                (d = n.p + l + n.s),
                                u && (d = { path: d, integrity: f }),
                                (a[s] = d);
                        }
                        return a;
                    }
                    return t;
                }),
                i = "" || e.p,
                r = n("market") || n("locale");
            r && (r = r.toLowerCase()),
                i ||
                    console.error(
                        "Unable to determine ".concat(
                            "manifests.js",
                            " file URL. Using default base URL. "
                        ) + 'This is expected if you are running "gulp serve."'
                    );
            for (var o = 0, s = a; o < s.length; o++) {
                var c = s[o].loaderConfig;
                if (
                    (i &&
                        ((c.internalModuleBaseUrls &&
                            0 !== c.internalModuleBaseUrls.length) ||
                            (c.internalModuleBaseUrls = [i])),
                    r)
                )
                    for (
                        var d = c.scriptResources, l = 0, u = Object.keys(d);
                        l < u.length;
                        l++
                    ) {
                        var f = d[u[l]];
                        if ("localizedPath" === f.type) {
                            var p = f,
                                m = p.paths;
                            if (m)
                                for (
                                    var _ = 0, h = Object.keys(m);
                                    _ < h.length;
                                    _++
                                ) {
                                    var b = h[_];
                                    if (b.toLowerCase() === r) {
                                        (p.defaultPath = m[b]), delete p.paths;
                                        break;
                                    }
                                }
                        }
                    }
            }
            return a;
        },
    };
    (self.debugManifests = a),
        define([], function () {
            return a;
        });
})();
