const path = require("path");

module.exports = {
    target: "node",
    mode: "production",
    entry: {
        app: './src/index.js',
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
}
