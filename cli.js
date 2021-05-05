#!/usr/bin/env node
'use strict'

const mri = require('mri')
const pkg = require('./package.json')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
		'quiet', 'q',
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    extract-gtfs-shapes <path-to-shapes-file> <output-directory>
Options:
    --concurrency    -c  How many files to write in parallel. Default: 32
    --quiet          -q  Don't log stats.
Examples:
    extract-gtfs-shapes -c 50 data/gtfs/shapes.txt shapes
    cat data/gtfs/shapes.txt | extract-gtfs-shapes - shapes
Notes:
    extract-gtfs-shapes needs the GTFS shapes.txt to be sorted by
    1. shape_id, alphanumerically
    2. shape_pt_sequence, numerically
    You can use Miller (https://miller.readthedocs.io/) and the
    Unix tool sponge to do this:
    mlr --csv sort -f shape_id -n shape_pt_sequence \\
      shapes.txt | sponge shapes.txt
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`extract-gtfs-shapes v${pkg.version}\n`)
	process.exit(0)
}

const {join: pathJoin} = require('path')
const {default: Queue} = require('p-queue')
const {writeFile} = require('fs/promises')
const extractGtfsShapes = require('.')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const pathToShapesFile = argv._[0]
if (!pathToShapesFile) {
	showError('Missing path-to-shapes-file parameter.')
}
const src = pathToShapesFile === '-'
	? process.stdin
	: pathToShapesFile

const outputDir = argv._[1]
if (!outputDir) {
	showError('Missing output-directory parameter.')
}

const concurrency = parseInt(argv.concurrency || argv.c || 32)
const queue = new Queue({concurrency})
// todo: listen for queue errors

const onShape = async (shapeId, shape) => {
	const path = pathJoin(outputDir, shapeId + '.geo.json')
	if (queue.size > concurrency * 3) await queue.onEmpty()
	queue.add(() => writeFile(path, shape))
}

const opt = {}
if (argv.quiet || argv.q) {
	opt.logProgress = () => {}
}

extractGtfsShapes(src, onShape, opt)
.catch(showError)
