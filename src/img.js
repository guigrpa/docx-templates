// @flow

/* eslint-disable new-cap */

import fs from 'fs-extra';


const overWriteImage = (dirMedia: string, options: JSON) => {
    fs.readdir(dirMedia, (err, files) => {
        files.forEach(function (element, index) {
            if (options.imgs[index]) {
                fs.readFile(options.imgs[index], function (err, resImgNew) {
                    fs.writeFile(`${dirMedia}${element}`, resImgNew, function (err) { });
                });
            }
        });
    });
};

// ==========================================
// Public API
// ==========================================
export {
    overWriteImage,
};
