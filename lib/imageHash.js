"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const buffer_1 = require("buffer");
const file_type_1 = __importDefault(require("file-type"));
const jpeg_js_1 = __importDefault(require("jpeg-js"));
const pngjs_1 = require("pngjs");
const request_1 = __importDefault(require("request"));
const url_1 = require("url");
const block_hash_1 = __importDefault(require("./block-hash"));
const webp_1 = __importDefault(require("@cwasm/webp"));
const processPNG = (data, bits, method, cb) => {
    try {
        const png = pngjs_1.PNG.sync.read(data);
        const res = block_hash_1.default(png, bits, method ? 2 : 1);
        cb(null, res);
    }
    catch (e) {
        cb(e);
    }
};
const processJPG = (data, bits, method, cb) => {
    try {
        const decoded = jpeg_js_1.default.decode(data);
        const res = block_hash_1.default(decoded, bits, method ? 2 : 1);
        cb(null, res);
    }
    catch (e) {
        cb(e);
    }
};
const processWebp = (data, bits, method, cb) => {
    try {
        const decoded = webp_1.default.decode(data);
        const res = block_hash_1.default(decoded, bits, method ? 2 : 1);
        cb(null, res);
    }
    catch (e) {
        cb(e);
    }
};
const isUrlRequestObject = (obj) => {
    const casted = obj;
    return casted.url && casted.url.length > 0;
};
const isBufferObject = (obj) => {
    const casted = obj;
    return buffer_1.Buffer.isBuffer(casted.data)
        || (buffer_1.Buffer.isBuffer(casted.data) && (casted.ext && casted.ext.length > 0));
};
// eslint-disable-next-line
exports.imageHash = (oldSrc, bits, method, cb) => {
    const src = oldSrc;
    const getFileType = (data) => __awaiter(this, void 0, void 0, function* () {
        if (typeof src !== 'string' && isBufferObject(src) && src.ext) {
            return {
                mime: src.ext,
            };
        }
        try {
            if (buffer_1.Buffer.isBuffer(data)) {
                return yield file_type_1.default.fromBuffer(data);
            }
            if (typeof src === 'string') {
                return yield file_type_1.default.fromFile(src);
            }
            return '';
        }
        catch (err) {
            throw err;
        }
    });
    const checkFileType = (name, data) => {
        getFileType(data).then((type) => {
            // what is the image type
            if (!type) {
                cb(new Error('Mime type not found'));
                return;
            }
            if (name && name.lastIndexOf('.') > 0) {
                const ext = name
                    .split('.')
                    .pop()
                    .toLowerCase();
                if (ext === 'png' && type.mime === 'image/png') {
                    processPNG(data, bits, method, cb);
                }
                else if ((ext === 'jpg' || ext === 'jpeg') && type.mime === 'image/jpeg') {
                    processJPG(data, bits, method, cb);
                }
                else if (ext === 'webp' && type.mime === 'image/webp') {
                    processWebp(data, bits, method, cb);
                }
                else {
                    cb(new Error(`Unrecognized file extension, mime type or mismatch, ext: ${ext} / mime: ${type}`));
                }
            }
            else {
                // console.warn('No file extension found, attempting mime typing.');
                if (type.mime === 'image/png') {
                    processPNG(data, bits, method, cb);
                }
                else if (type.mime === 'image/jpeg') {
                    processJPG(data, bits, method, cb);
                }
                else if (type.mime === 'image/webp') {
                    processWebp(data, bits, method, cb);
                }
                else {
                    cb(new Error(`Unrecognized mime type: ${type}`));
                }
            }
        }).catch((err) => {
            cb(err);
        });
    };
    const handleRequest = (err, res) => {
        if (err) {
            cb(new Error(err));
        }
        else {
            const url = new url_1.URL(res.request.uri.href);
            const name = url.pathname;
            checkFileType(name, res.body);
        }
    };
    const handleReadFile = (err, res) => {
        if (err) {
            cb(new Error(err));
            return;
        }
        checkFileType(src, res);
    };
    // check source
    // is source assigned
    if (src === undefined) {
        cb(new Error('No image source provided'));
        return;
    }
    // is src url or file
    if (typeof src === 'string' && (src.indexOf('http') === 0 || src.indexOf('https') === 0)) {
        // url
        const req = {
            url: src,
            encoding: null,
        };
        request_1.default(req, handleRequest);
    }
    else if (typeof src !== 'string' && isBufferObject(src)) {
        // image buffers
        checkFileType(src.name, src.data);
    }
    else if (typeof src !== 'string' && isUrlRequestObject(src)) {
        // Request Object
        src.encoding = null;
        request_1.default(src, handleRequest);
    }
    else {
        // file
        fs_1.default.readFile(src, handleReadFile);
    }
};
//# sourceMappingURL=imageHash.js.map