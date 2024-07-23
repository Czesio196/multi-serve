const esbuild = require('esbuild');
const { copy } = require('esbuild-plugin-copy');

esbuild.build({
    entryPoints: ['./src/index.js'],
    bundle: true,
    minify: false,
    sourcemap: false,
    platform: 'node',
    target: ['node8'],
    outdir: 'lib',
    format: 'cjs',
    minify: true,
    // external: ['coffee-script'],
    packages: 'external',
    plugins: [
        copy({
            assets: {
                from: ['./src/templates/**/*'],
                to: ['./templates']
            }
        })
    ]
});
