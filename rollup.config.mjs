import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json'; // Add JSON plugin

export default [
  {
    input: 'src/lib/index.ts',
    output: [
      {
        file: 'dist/lib/cjs/index.cjs',
        format: 'cjs',
        entryFileNames: '[name].cjs',
        sourcemap: true
      },
      {
        file: 'dist/lib/esm/index.mjs',
        format: 'esm',
        entryFileNames: '[name].mjs',
        sourcemap: true
      }
    ],
    external: ['scrypt-js'],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        target: 'es2020',
        strict: true,
        esModuleInterop: true,
        include: ['src/lib/**/*'],
      }),
      terser()
    ],
  },
  // Web build (bundle dependencies)
  {
    input: 'src/lib/index.ts',
    output: {
      file: 'docs/scripts/bundle.js',
      format: 'umd',
      name: 'keyra'
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
        mainFields: ['browser', 'module', 'main']
      }),
      commonjs(),
      typescript({
        target: 'es2020',
        strict: true,
        esModuleInterop: true,
        include: ['src/lib/**/*'],
      }),
      terser()
    ],
  },
  {
    input: 'src/lib/index.ts',
    output: {
      file: 'dist/types/index.d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
  {
    input: 'src/cli/start.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'cjs',
      exports: 'auto'
    },
    external: ['scrypt-js', 'commander'],
    plugins: [
      nodeResolve(),
      json(),
      typescript({
        module: 'es2020',
        target: 'es2020',
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        include: ['src/cli/**/*', 'src/lib/**/*'],
      }),
      terser()
    ],
  },
];