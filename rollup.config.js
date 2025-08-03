import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.js',
    output: {
        dir: 'dist',
        format: 'cjs',
        strict: false,
        exports: 'named',
    },
    plugins: [
        json(),
        nodeResolve(),
        commonjs({
            dynamicRequireTargets: [
                'node_modules/x11/lib/ext/*.js',
            ],
        }),
        babel({ babelHelpers: 'bundled' }),
        terser(),
    ],
};
