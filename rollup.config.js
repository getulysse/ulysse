import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.js',
    output: {
        format: 'cjs', dir: 'dist', exports: 'named',
    },
    plugins: [
        json(),
        commonjs(),
        babel({ babelHelpers: 'bundled' }),
    ],
};
