'use strict'

const {basename} = require('path')
const readCsv = require('gtfs-utils/read-csv')
const expectSorting = require('gtfs-utils/lib/expect-sorting')

const formatShapeAsGeoJSONLineString = (shapeId, points) => {
	const coords = points
	.map(p => `[${p[0]},${p[1]}]`)
	.join(',')
	return `\
{
	"type": "Feature",
	"properties": {
		"shape_id": ${JSON.stringify(shapeId)}
	},
	"geometry": {
		"type": "LineString",
		"coordinates": [${coords}]
	}
}`
}

const logProgressToStdout = ({rowsRead, shapesProcessed}) => {
	process.stdout.write(`${rowsRead} rows read, ${shapesProcessed} shape files processed\n`)
}

const extractGtfsShapes = async (pathToShapesTxtOrStream, onShape, opt = {}) => {
	const {
		logger,
		formatShape,
		logProgress,
	} = {
		logger: console,
		formatShape: formatShapeAsGeoJSONLineString,
		logProgress: logProgressToStdout,
		...opt,
	}

	const shapesFile = 'string' === typeof pathToShapesTxtOrStream
		? basename(pathToShapesTxtOrStream)
		: 'shapes.txt'
	const checkSorting = expectSorting(shapesFile, (a, b) => {
		if (a.shape_id < b.shape_id) return -1
		if (a.shape_id > b.shape_id) return 1
		const seqA = parseInt(a.shape_pt_sequence)
		const seqB = parseInt(b.shape_pt_sequence)
		return seqA - seqB
	})

	let shapeId = NaN
	let points = []
	let rowsRead = 0
	let shapesProcessed = 0
	let tLastLog = Date.now()

	const processShape = async () => {
		await onShape(shapeId, formatShape(shapeId, points))
		shapesProcessed++
	}

	for await (const row of readCsv(pathToShapesTxtOrStream)) {
		if (!row.shape_id || !row.shape_pt_sequence) {
			process.stderr.write(`${shapesFile}:${rowsRead} has no shape_id/shape_pt_sequence`)
			process.exit(1)
		}
		checkSorting(row)

		if (row.shape_id !== shapeId) {
			if (rowsRead > 0) await processShape()
			shapeId = row.shape_id
			points = []
		}
		points.push([row.shape_pt_lon, row.shape_pt_lat])

		rowsRead++
		if (Date.now() > (tLastLog + 5 * 1000)) {
			tLastLog = Date.now()
			logProgress({rowsRead, shapesProcessed})
		}
	}
	await processShape()
	logProgress({rowsRead, shapesProcessed})
}

module.exports = extractGtfsShapes
