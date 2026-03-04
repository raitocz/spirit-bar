/**
 * QR SVG helper – wraps qrcode-generator library.
 * Produces an SVG with optional brand gradient applied across the whole code.
 */
var QR = (function () {
  "use strict";

  /**
   * toSVG(text, opts?)
   *   opts.size     – SVG width/height in px (default 200)
   *   opts.gradient – if true, use brand gradient fill across entire QR
   */
  function toSVG(text, opts) {
    opts = opts || {};
    var px = opts.size || 200;

    if (typeof qrcode !== "function") return "";

    var qr = qrcode(0, "M");
    qr.addData(text);
    qr.make();

    var count = qr.getModuleCount();
    var quiet = 2;
    var total = count + quiet * 2;

    // Build a single path for all dark modules (gradient applies to whole shape)
    var d = "";
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          d += "M" + (c + quiet) + "," + (r + quiet) + "h1v1h-1z";
        }
      }
    }

    var fill;
    if (opts.gradient) {
      fill =
        '<defs><linearGradient id="qrg" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#2635d4"/>' +
        '<stop offset="100%" stop-color="#00cfff"/>' +
        '</linearGradient></defs>';
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total +
        '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges">' +
        fill + '<path d="' + d + '" fill="url(#qrg)"/></svg>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + " " + total +
      '" width="' + px + '" height="' + px + '" shape-rendering="crispEdges">' +
      '<path d="' + d + '" fill="#000"/></svg>';
  }

  return { toSVG: toSVG };
})();
