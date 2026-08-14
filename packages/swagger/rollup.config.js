import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'

const input = 'src/index.ts'
const external = ['fs', 'path', 'reflect-metadata', '@lunafw/core', '@lunafw/common', 'swagger-ui-dist']

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
    external,
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
    external,
    plugins: [dts({ tsconfig: './tsconfig.json' })],
  },
]
