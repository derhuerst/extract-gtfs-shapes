#!/usr/bin/env node

const {execSync} = require('child_process')
const {join: pathJoin} = require('path')
const {readFileSync, statSync} = require('fs')
const {strictEqual: eql, throws} = require('assert')

const expected = {
	A: `\
[11.0,11.1],[13.0,13.1],[14.0,14.1],[100.0,100.1],[101.0,101.1]`,
	B: `\
[20.0,20.1],[21.0,21.1],[23.0,23.1]`,
	C: `\
[30.0,30.1],[31.0,31.1],[33.0,33.1]`,
	D: `\
[-40.0,40.1],[-41.0,41.1]`,
	E: `\
[50.0,50.1],[51.0,51.1],[53.0,53.1]`,
	F: `\
[60.0,-60.1],[61.0,-61.1]`,
}

execSync('rm -rf out')
execSync('mkdir out')

execSync('./cli.js -q -c 2 test/shapes.csv test/out', {
	cwd: pathJoin(__dirname, '..'),
})

for (const [shapeId, coords] of Object.entries(expected)) {
	const file = `${shapeId}.geo.json`
	const path = pathJoin(__dirname, 'out', file)
	const shape = readFileSync(path, {encoding: 'utf8'})

	eql(shape, `\
{
	"type": "Feature",
	"properties": {
		"shape_id": "${shapeId}"
	},
	"geometry": {
		"type": "LineString",
		"coordinates": [${expected[shapeId]}]
	}
}`, `${path} is invalid`)
}

throws(() => {
	statSync(pathJoin(__dirname, 'out', 'NaN.geo.json'))
}, {code: 'ENOENT'}, 'NaN.geo.json does not exist')

console.log('files look correct ✔︎')
