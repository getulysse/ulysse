import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
    input: 'src/index.js',
    external: ['x11'],
    output: {
        format: 'cjs', dir: 'dist', exports: 'named',
    },
    plugins: [
        json(),
        terser(),
        commonjs(),
        nodeResolve(),
        babel({ babelHelpers: 'bundled' }),
        alias({ entries: { x11: require.resolve('./src/x11-shim.js') } }),
    ],
};
