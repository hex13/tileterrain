let affected = Object.create(null);

function fequal(a, b) {
    return Math.abs(a - b) < 0.001;
}

export function createTerrain({
        tile,
        rows,
        columns,
        tileSize,
        onChange,
        use = {},
        shouldUseIndices = false,
    }) {
    const _onChange = () => {
        let bufferGeometry;
        if (use.THREE) {
            const { THREE } = use;
            bufferGeometry = new THREE.BufferGeometry();

            let position;
            if (shouldUseIndices) {
                bufferGeometry.setIndex(bufferFaces);
                position = bufferVertices;
            } else {
                position = [];
                for (let i = 0; i < bufferFaces.length; i += 3) {
                    for (let j = 0; j < 3; j++) {
                        const idx = bufferFaces[i + j];
                        position.push(bufferVertices[idx * 3]);
                        position.push(bufferVertices[idx * 3 + 1]);
                        position.push(bufferVertices[idx * 3 + 2]);
                    }
                }
            }
            bufferGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
            bufferGeometry.getAttribute('position').needsUpdate = true;

            bufferGeometry.computeVertexNormals();
            // bufferGeometry.needsUpdate = true;
        }
        onChange && onChange({
            geometry: bufferGeometry,
        });
    };
    const bufferVertices = [];
    const bufferFaces = [];
    const getVertexElevationByIndex = (idx) => {
        return bufferVertices[idx * 3 + 2];
    };
    const setVertexElevationByIndex = (idx, z) => {
       bufferVertices[idx * 3 + 2] = z;
    }
    const addVertex = (x, y, z) => {
        bufferVertices.push(x, y, z);
    };
    const addFace = (a, b, c) => {
        bufferFaces.push(a, b, c);
    };

    const GROUND_W = columns;
    const GROUND_H = rows;

    const tiles = new Array(GROUND_W);

    for (let i = 0; i < GROUND_W; i++)
        tiles[i] = new Array(GROUND_H);

    for (let y = 0; y <= GROUND_H; y++) {
        for (let x = 0; x <= GROUND_W; x++) {
            const xFrom = x * tileSize;
            const yFrom = y * tileSize;

            const z = tile.z;

            addVertex(xFrom, yFrom, z);
        }

        if (y < GROUND_H) for (let x = 0; x < GROUND_W; x++) {
            const xFrom = x * tileSize;
            const yFrom = y * tileSize;
            const xMiddle = xFrom + tileSize / 2;
            const yMiddle = yFrom + tileSize / 2;

            const z = tile.z;

            addVertex(xMiddle, yMiddle, z);
        }
    }


    for (let y = 0; y < GROUND_H; y++) {
        for (let x = 0; x < GROUND_W; x++) {
            const bottomLeftIdx = (2 * GROUND_W + 1) * y + x;
            const bottomRightIdx =  bottomLeftIdx + 1;
            const middleIdx =  bottomLeftIdx + GROUND_W + 1;
            const topLeftIdx =  middleIdx + GROUND_W;
            const topRightIdx =  topLeftIdx + 1;
            const _faces = [
                [bottomLeftIdx, bottomRightIdx, middleIdx],
                [bottomLeftIdx, middleIdx, topLeftIdx],
                [middleIdx, topRightIdx, topLeftIdx],
                [middleIdx, bottomRightIdx, topRightIdx],
            ];
            _faces.forEach(([a, b, c]) => {
                return addFace(a, b, c);
            });

            tiles[x][y] = {
                vertices: {
                    bottomLeftIdx,
                    bottomRightIdx,
                    middleIdx,
                    topLeftIdx,
                    topRightIdx,
                }
            }
        }
    }

    function computeIndexes(x, y) {
        const bottomLeftIdx = (2 * GROUND_W + 1) * y + x;
        const bottomRightIdx =  bottomLeftIdx + 1;
        const middleIdx =  bottomLeftIdx + GROUND_W + 1;
        const topLeftIdx =  middleIdx + GROUND_W;
        const topRightIdx =  topLeftIdx + 1;
        return {
            bottomLeftIdx,
            bottomRightIdx,
            middleIdx,
            topLeftIdx,
            topRightIdx,
        };
    }

    function _raise({ x, y }, amount = tileSize / 2, r = 0) {

        function adjustMiddle(x, y) {
            if (x < 0 || x >= GROUND_W || y< 0 || y >= GROUND_H) return;
            const tileIndexes = computeIndexes(x, y);

            const z1 = getVertexElevationByIndex(tileIndexes.topLeftIdx);
            const z2 = getVertexElevationByIndex(tileIndexes.topRightIdx);
            const z3 = getVertexElevationByIndex(tileIndexes.bottomLeftIdx);
            const z4 = getVertexElevationByIndex(tileIndexes.bottomRightIdx);
            const cmpFunc = amount >= 0? Math.min : Math.max;
            let nz = (z1 + z2 + z3 + z4) / 4;
            const threshold = Math.abs(amount) / 3;
            const zs = [z1, z2, z3, z4];
            for (let i = 0; i < 4; i++) {
                if (Math.abs(nz - zs[i]) <= threshold) {
                    nz = zs[i]; // snap to vertex
                    break;
                }
            }
            setVertexElevationByIndex(tileIndexes.middleIdx, nz);
        }

        function adjustVertex(idx, z) {
            if (affected[idx] === undefined) {
                affected[idx] = getVertexElevationByIndex(idx);
            }

            const direction = Math.sign(z - affected[idx]);
            if (Math.abs(z - affected[idx]) <= Math.abs(amount)) {
                setVertexElevationByIndex(idx, z);
            } else {
                setVertexElevationByIndex(idx, affected[idx] + Math.abs(amount) * direction);
            }
        }

        const computeZ = (_x,_y) => amount * (
            1 / (
                 Math.sqrt(_x * _x + _y * _y) + 1
            )
        );

        function adjustTile(x, y, _x, _y) {
            const finalX = x + _x;
            const finalY = y + _y;
            if (finalX < 0 || finalY < 0 || finalX >= columns || finalY >= rows) return;

            const { bottomLeftIdx, bottomRightIdx, middleIdx, topLeftIdx, topRightIdx } = computeIndexes(finalX, finalY);

            const cmpFunc = amount >= 0? Math.max : Math.min;
            const extremeZ = cmpFunc(
                getVertexElevationByIndex(middleIdx),
                getVertexElevationByIndex(bottomLeftIdx),
                getVertexElevationByIndex(bottomRightIdx),
                getVertexElevationByIndex(topLeftIdx),
                getVertexElevationByIndex(topRightIdx),
            );
            const flat = (
                getVertexElevationByIndex(middleIdx) == extremeZ &&
                getVertexElevationByIndex(bottomLeftIdx) == extremeZ &&
                getVertexElevationByIndex(bottomRightIdx) == extremeZ &&
                getVertexElevationByIndex(topLeftIdx) == extremeZ &&
                getVertexElevationByIndex(topRightIdx) == extremeZ
            );
            const targetZ = flat? extremeZ + computeZ(_x, _y) : extremeZ;

            if ( _x <= 0 && _y <= 0)
                adjustVertex(bottomLeftIdx, targetZ);
            if (_x >= 0 && _y <= 0)
                adjustVertex(bottomRightIdx, targetZ);
            if (_x <= 0 && _y >= 0)
                adjustVertex(topLeftIdx, targetZ);
            if (_x >= 0 &&  _y >= 0)
                adjustVertex(topRightIdx, targetZ);
        }

        for (let _y = -r; _y <= r; _y++) {
            for (let _x = -r; _x <= r; _x++) {
                adjustTile(x, y, _x, _y);
            }
        }


        for (let _y = -r - 1; _y <= r + 1; _y++) {
            for (let _x = -r - 1; _x <= r + 1; _x++) {
                adjustMiddle(x + _x, y + _y);
            }
        }
        _onChange();
    }

    function inBounds(x, y) {
        return x >= 0 && y >= 0 && x < columns && y < rows;
    }

    setTimeout(_onChange, 0);

    return {
        raise: (...args) => {
            _raise(...args);
        },
        clearAffectedList: () => {
            affected = Object.create(null);
        },
        inBounds,
        getAffected: () => affected,
        getElevationAt(tile) {
            if (!inBounds(tile.x, tile.y)) {
                console.error(`(${tile.x}, ${tile.y}) is out of map bounds`)
                return {
                    z: tile.z
                }
            }

            try {
            const tileData = tiles[tile.x][tile.y];

            const middle = getVertexElevationByIndex(tileData.vertices.middleIdx);
            const topLeft = getVertexElevationByIndex(tileData.vertices.topLeftIdx);
            const topRight = getVertexElevationByIndex(tileData.vertices.topRightIdx);
            const bottomLeft = getVertexElevationByIndex(tileData.vertices.bottomLeftIdx);
            const bottomRight = getVertexElevationByIndex(tileData.vertices.bottomRightIdx);
            const equal = topLeft

            const minElevation = Math.min(middle, topLeft, topRight, bottomLeft, bottomRight);
            const maxElevation = Math.max(middle, topLeft, topRight, bottomLeft, bottomRight);

            // const slope = Math.max(
            //     Math.abs(middle - topLeft),
            //     Math.abs(middle - topRight),
            //     Math.abs(middle - bottomLeft),
            //     Math.abs(middle - bottomRight),
            // );
            return {
                z: middle,
                topEqual: fequal(topLeft, topRight),
                bottomEqual: fequal(bottomLeft, bottomRight),
                leftEqual: fequal(topLeft, bottomLeft),
                rightEqual: fequal(topRight, bottomRight),
                slope: maxElevation - minElevation,
                // slope: !(fequal(middle, topLeft) && fequal(middle, topRight) && fequal(middle, bottomLeft) && fequal(middle, bottomRight))
            }
            } catch (e) {
                console.error(tile)
            }

        }
    }
}
