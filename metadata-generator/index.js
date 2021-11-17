const { File, NFTStorage } = require('nft.storage');
const fs = require("fs");
const path = require("path");
require('dotenv').config()

console.log("AAPI KEY", process.env.NFT_STORAGE_KEY);

const apiKey = process.env.NFT_STORAGE_KEY;
const client = new NFTStorage({ token: apiKey });

function ArrayBufferToBinary(buffer) {
    let uint8 = new Uint8Array(buffer);
    return uint8.reduce((binary, uint8) => binary + uint8.toString(2), "");
}

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = Buffer.from(b64Data, 'base64').toString('binary');
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}

const toBlob = (arraybuffer) => {
    let buffer = Buffer.from(arraybuffer);
    let binary = Uint8Array.from(buffer).buffer;
    return binary
}

// const readFile = async (path) => {
//     const fileContent = await new Promise((resolve, reject) => {
//         fs.readFile(path, (err, data) => {
//             if (err) {
//                 reject(err);
//             }
//             resolve(data);
//         });
//     });
//
//     return fileContent;
// }

// const getImg = async () => {
//     // preliminary code to handle getting local file and finally printing to console
//     // the results of our function ArrayBufferToBinary().
//     let file = await readFile(path.resolve(__dirname, "./files/img.jpg"));
//     // const base = Buffer.from(file).toString('base64');
//
//     return file;
//     // let reader = new FileReader();
//     //
//     // return new Promise((resolve) => {
//     //     reader.onload = function(event) {
//     //         let data = event.target.result;
//     //         const binaryData = ArrayBufferToBinary(data);
//     //         console.log(binaryData);
//     //         console.log(binaryData);
//     //         const blob = new Blob(binaryData, "jpg")
//     //         resolve(binaryData);
//     //     };
//     //     reader.readAsArrayBuffer(file); //gets an ArrayBuffer of the file
//     // })
// }

function toArrayBuffer(buffer) {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function generateMetadata(req, res, next) {
    // const fileInput = req.file;

    const file = req.file;
    const { name, description } = req.body;

    console.log("body", req.body);
    console.log("file", file);

    const parsedFileImg = new File(file.buffer, "", { type: file.mimetype });

    const metadata = await client.store({
        ...{ name, description },
        image: parsedFileImg
    })

    console.log("metadata", metadata)
    console.log("file", metadata.url)

    return metadata.url;
};

module.exports = { generateMetadata };
