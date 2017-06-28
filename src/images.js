// @flow

/* eslint-disable new-cap */

//import fs from 'fs-extra';
import fs from 'fs';

const overWriteImage = (oldImg: string, newImg: string) => {
    if (newImg && newImg.id && newImg.base64) {
        console.log('newImg.base64 ', newImg.base64)
        let decodedImage = new Buffer(newImg.base64, 'base64');
        console.log('decodedImage ', decodedImage)
        fs.writeFile(oldImg, decodedImage, function (err) { });
        /**fs.readFile(newImg.path, function (err, resImgNew) {
            fs.writeFile(oldImg, resImgNew, function (err) { });
        });*/
    }
}

// ==========================================
// Public API
// ==========================================
export {
    overWriteImage,
};
