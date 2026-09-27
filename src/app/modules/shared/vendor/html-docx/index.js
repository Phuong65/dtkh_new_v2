"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asBlob = void 0;
var internal_1 = require("./internal");
var JSZip = require("jszip");
async function asBlob(html, options = {}) {
    const zip = new JSZip();
    internal_1.addFiles(zip, html, options);
    return internal_1.generateDocument(zip);
}
exports.asBlob = asBlob;
//# sourceMappingURL=index.js.map