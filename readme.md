# extract-gtfs-shapes

Command line tool to **extract [shapes](https://gtfs.org/reference/static#shapestxt) from a [GTFS](https://gtfs.org) dataset.**

[![npm version](https://img.shields.io/npm/v/extract-gtfs-shapes.svg)](https://www.npmjs.com/package/extract-gtfs-shapes)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/extract-gtfs-shapes.svg)
![minimum Node.js version](https://img.shields.io/node/v/extract-gtfs-shapes.svg)
[![support me via GitHub Sponsors](https://img.shields.io/badge/support%20me-donate-fa7664.svg)](https://github.com/sponsors/derhuerst)
[![chat with me on Twitter](https://img.shields.io/badge/chat%20with%20me-on%20Twitter-1da1f2.svg)](https://twitter.com/derhuerst)


## Installation

```shell
npm install -g extract-gtfs-shapes
```


## Usage

```
Usage:
    extract-gtfs-shapes <path-to-shapes-file> <output-directory>
Options:
    --concurrency    -c  How many files to write in parallel. Default: 32
    --quiet          -q  Don't log stats.
Examples:
    extract-gtfs-shapes -c 50 data/gtfs/shapes.txt shapes
    cat data/gtfs/shapes.txt | extract-gtfs-shapes - shapes
```

### from JavaScript

Let's build a simple (and slower) clone of the the `extract-gtfs-shapes` CLI tool documented above:

```js
const {writeFile} = require('fs/promises')
const extractGTFSShapes = require('extract-gtfs-shapes')

const processShape = async (shapeId, shape) => {
    await writeFile(shapeId + 'geo.json', shape)
}
await extractGTFSShapes('path/to/shapes.txt', processShape)
```


## Contributing

If you have a question or need support using `extract-gtfs-shapes`, please double-check your code and setup first. If you think you have found a bug or want to propose a feature, use [the issues page](https://github.com/derhuerst/extract-gtfs-shapes/issues).
