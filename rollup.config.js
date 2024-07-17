import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.js',
    output: {
        format: 'cjs', dir: 'dist', exports: 'named',
    },
    plugins: [
        json(),
        terser(),
        commonjs({
            dynamicRequireTargets: [
                'node_modules/x11/lib/ext/big-requests.js',
            ],
        }),
        nodeResolve(),
        babel({ babelHelpers: 'bundled' }),
    ],
};
