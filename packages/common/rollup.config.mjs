import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

const input = 'src/index.ts'

export default [
  {
    input,
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: ['reflect-metadata', '@lunafw/core'],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
    ],
  },
  {
    input,
    output: {
      file: 'dist/index.d.ts',
      format: 'esm',
    },
    plugins: [dts({ tsconfig: './tsconfig.json' })],
  },
]
