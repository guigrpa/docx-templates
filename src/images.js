// @flow

/* eslint-disable new-cap */

//import fs from 'fs-extra';
import fs from 'fs';

const overWriteImage = (oldImg: string, newImg: string) => {
    if (newImg) {
        fs.readFile(newImg.path, function (err, resImgNew) {
            fs.writeFile(oldImg, resImgNew, function (err) { });
        });
    }
}

// ==========================================
// Public API
// ==========================================
export {
    overWriteImage,
};
