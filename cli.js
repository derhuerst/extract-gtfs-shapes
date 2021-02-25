#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    extract-gtfs-shapes <path-to-shapes-file> <output-directory>
Options:
Examples:
    extract-gtfs-shapes data/gtfs/shapes.txt shapes
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`extract-gtfs-shapes v${pkg.version}\n`)
	process.exit(0)
}

const {basename, join: pathJoin} = require('path')
const readCsv = require('gtfs-utils/read-csv')
const {default: Queue} = require('p-queue')
const expectSorting = require('gtfs-utils/lib/expect-sorting')
const {writeFile} = require('fs/promises')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const pathToShapesFile = argv._[0]
if (!pathToShapesFile) {
	showError('Missing path-to-shapes-file parameter.')
}
const shapesFile = basename(pathToShapesFile)

const outputDir = argv._[1]
if (!outputDir) {
	showError('Missing output-directory parameter.')
}

const concurrency = 64 // todo: make customisable

;(async () => {
	const queue = new Queue({concurrency})

	const checkSorting = expectSorting(shapesFile, (a, b) => {
		if (a.shape_id < b.shape_id) return -1
		if (a.shape_id > b.shape_id) return 1
		const seqA = parseInt(a.shape_pt_sequence)
		const seqB = parseInt(b.shape_pt_sequence)
		return seqA - seqB
	})

	let newShapeStarts = true
	let shapeId = NaN
	let points = ''

	const finishShape = async () => {
		const path = pathJoin(outputDir, shapeId + '.geo.json')
		const shape = `\
{
	"type": "Feature",
	"properties": {
		"shape_id": ${JSON.stringify(shapeId)}
	},
	"geometry": {
		"type": "LineString",
		"coordinates": [${points}]
	}
}`
		// write shape to disk
		if (queue.size > concurrency * 3) await queue.onEmpty()
		queue.add(async () => await writeFile(path, shape))

		newShapeStarts = true
	}

	for await (const row of readCsv(pathToShapesFile)) {
		checkSorting(row)

		if (!newShapeStarts && row.shape_id !== shapeId) await finishShape()

		if (newShapeStarts) {
			newShapeStarts = false
			shapeId = row.shape_id
			points = `[${row.shape_pt_lon},${row.shape_pt_lat}]`
		} else {
			points += `,[${row.shape_pt_lon},${row.shape_pt_lat}]`
		}
	}
	await finishShape()
})().catch(showError)
