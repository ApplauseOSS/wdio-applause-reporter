import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import dts from "rollup-plugin-dts";

export default [{
	input: 'src/index.ts',
	output: [{
		format: 'esm',
		file: pkg.module,
		sourcemap: true,
	}, {
		format: 'cjs',
		file: pkg.main,
		sourcemap: true,
	}, {
		name: pkg['umd:name'] || pkg.name,
		format: 'umd',
		file: pkg.unpkg,
		sourcemap: true,
		plugins: [
			terser()
		]
	}],
	external: [
		...require('module').builtinModules,
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {}),
	],
	plugins: [
		resolve(),
		typescript()
	]
},
{
	input: "src/index.ts",
	output: [{ file: "dist/index.d.ts", format: "es" }],
	plugins: [dts()],
  },
]