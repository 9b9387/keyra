import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

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
        tsconfig: './tsconfig.lib.json'
      }),
    ],
  },
    // 类型声明
    {
        input: 'src/lib/index.ts',
        output: {
          file: 'dist/lib/types/index.d.ts',
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
        tsconfig: './tsconfig.cli.json',
        compilerOptions: {
          module: 'esnext'
        }
      }),
    ],
  },
];