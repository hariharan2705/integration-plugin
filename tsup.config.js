export default {
    entry: ["src/index.jsx"],
    loader: {
        ".js": "jsx",
    },
    format: ["esm", "cjs"],
    dts: false,
    sourcemap: false,
    minify: true,
    clean: true,
    external: [
        "react",
        "react-dom",
        "react-dom/client",
    ],
};