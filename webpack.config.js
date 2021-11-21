const path = require("path");

module.exports = {
    target: "node",
    mode: "development",
    entry: './src/index.js',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
}
