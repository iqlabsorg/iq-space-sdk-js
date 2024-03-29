import ts from 'rollup-plugin-ts';
import del from 'rollup-plugin-delete';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import autoExternal from 'rollup-plugin-auto-external';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) console.info('Building for production!');

export const buildPluginsSection = () => [
  del({ targets: 'dist/*' }),
  nodeResolve(),
  commonjs(),
  ts({
    tsconfig: 'tsconfig.build.json',
    transpiler: 'swc',
  }),
  autoExternal(),
  isProduction &&
    terser({
      output: {
        comments: false,
      },
    }),
];

export const buildConfig = ({ pkg }) => {
  return {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: isProduction,
      },
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: isProduction,
      },
    ],
    plugins: buildPluginsSection(),
    external: ['@iqprotocol/iq-space-protocol-light/typechain'],
  };
};

import pkg from './package.json';
export default buildConfig({ pkg });
