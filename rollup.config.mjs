import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

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
    external: ['crypto'],
    plugins: [
      nodeResolve(),
      typescript({
        target: 'ES2018',
        strict: true,
        esModuleInterop: true,
        include: ['src/lib/**/*'],
        exclude: ['node_modules', '**/*.test.ts']
      }),
      terser()
    ],
  },
  {
    input: 'src/lib/index.ts',
    output: {
      file: 'dist/types/index.d.ts', // 修改输出路径到 dist/types
      format: 'esm',
    },
    plugins: [dts()],
  },
  {
    input: 'src/cli/start.ts',
    output: {
      file: 'dist/cli/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    external: ['commander'],
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      typescript({
        module: 'esnext',
        target: 'esnext',
        include: ['src/cli/**/*', 'src/lib/**/*'],
      }),
      terser()
    ],
  },
];