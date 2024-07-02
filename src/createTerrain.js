import * as THREE from 'three';
import { Geometry } from '../vendor/Geometry';
let affected = Object.create(null);
console.log("GEOM", Geometry);
function fequal(a, b) {
    return Math.abs(a - b) < 0.001;
}

function createFaceVertexUvs({ bottomLeftUv, bottomRightUv, topLeftUv, topRightUv, middleUv }) {
    const faceVertexUvs = [];

    faceVertexUvs.push([
        new THREE.Vector2(bottomLeftUv.x, bottomLeftUv.y),
        new THREE.Vector2(bottomRightUv.x, bottomRightUv.y),
        new THREE.Vector2(middleUv.x, middleUv.y),
    ]);

    faceVertexUvs.push([
        new THREE.Vector2(bottomLeftUv.x, bottomLeftUv.y),
        new THREE.Vector2(middleUv.x, middleUv.y),
        new THREE.Vector2(topLeftUv.x, topLeftUv.y),
    ]);

    faceVertexUvs.push([
        new THREE.Vector2(middleUv.x, middleUv.y),
        new THREE.Vector2(topRightUv.x, topRightUv.y),
        new THREE.Vector2(topLeftUv.x, topLeftUv.y),
    ]);

    faceVertexUvs.push([
        new THREE.Vector2(middleUv.x, middleUv.y),
        new THREE.Vector2(bottomRightUv.x, bottomRightUv.y),
        new THREE.Vector2(topRightUv.x, topRightUv.y),
    ]);
    return faceVertexUvs
    ;
}

export function createTerrain({
        tile,
        rows,
        columns,
        tileSize,
        onChange,
    }) {
    const _onChange = () => {
        geometry.uvsNeedUpdate = true;
        geometry.normalsNeedUpdate = true;
        geometry.verticesNeedUpdate = true;
        geometry.computeFaceNormals();
        // geometry.computeVertexNormals();
        geometry.computeFlatVertexNormals();
        onChange && onChange({
            geometry: geometry.toBufferGeometry(),
        });
    };
    const geometry = new Geometry();
    const getVertexElevationByIndex = (idx) => {
        return geometry.vertices[idx].z;
    };
    const addVertex = (x, y, z) => {
        geometry.vertices.push(new THREE.Vector3(x, y, z));
    };
    const addFace = (a, b, c) => {
        const face = new THREE.Face3(a, b, c, new THREE.Vector3(0, 1, 0), 0xffffff, 0);
        geometry.faces.push(face);
        return face;
    };

    const GROUND_W = columns;
    const GROUND_H = rows;

    const tiles = new Array(GROUND_W);

    for (let i = 0; i < GROUND_W; i++)
        tiles[i] = new Array(GROUND_H);

    for (let y = 0; y <= GROUND_H; y++) {
        for (let x = 0; x <= GROUND_W; x++) {
            const xFrom = x * tileSize - tileSize * GROUND_W / 2;
            const yFrom = y * tileSize - tileSize * GROUND_H / 2;

            const z = tile.z;

            addVertex(xFrom, yFrom, z);
        }

        if (y < GROUND_H) for (let x = 0; x < GROUND_W; x++) {
            const xFrom = x * tileSize - tileSize * GROUND_W / 2;
            const yFrom = y * tileSize - tileSize * GROUND_H / 2;
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

            tiles[x][y] = {
                faces: _faces.map(([a, b, c]) => {
                    return addFace(a, b, c);
                }),
                vertices: {
                    bottomLeftIdx,
                    bottomRightIdx,
                    middleIdx,
                    topLeftIdx,
                    topRightIdx,
                }
            }

            // TODO restore or remove 
            // geometry.faceVertexUvs[0].push(...createFaceVertexUvs({
            //     bottomLeftUv: {x: x / GROUND_W, y: y / GROUND_H},
            //     bottomRightUv: {x: (x + 1) / GROUND_W, y: y / GROUND_H},
            //     topLeftUv: {x: x / GROUND_W, y: (y + 1) / GROUND_H},
            //     topRightUv: {x: (x + 1) / GROUND_W, y: (y + 1) / GROUND_H},
            //     middleUv: {x: (x + 0.5) / GROUND_W, y: (y + 0.5) / GROUND_H},
            // }))
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
        const { vertices } = geometry;

        function adjustMiddle(x, y) {
            if (x < 0 || x >= GROUND_W || y< 0 || y >= GROUND_H) return;
            const tileIndexes = computeIndexes(x, y);
            const z1 = vertices[tileIndexes.topLeftIdx].z;
            const z2 = vertices[tileIndexes.topRightIdx].z;
            const z3 = vertices[tileIndexes.bottomLeftIdx].z;
            const z4 = vertices[tileIndexes.bottomRightIdx].z;
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
            vertices[tileIndexes.middleIdx].z = nz;
        }

        function adjustVertex(idx, z) {
            if (affected[idx] === undefined) {
                affected[idx] = vertices[idx].z;
            }

            const direction = Math.sign(z - affected[idx]);
            if (Math.abs(z - affected[idx]) <= Math.abs(amount)) {
                vertices[idx].z = z;
            } else {
                vertices[idx].z = affected[idx] + Math.abs(amount) * direction;
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
                vertices[middleIdx].z,
                vertices[bottomLeftIdx].z,
                vertices[bottomRightIdx].z,
                vertices[topLeftIdx].z,
                vertices[topRightIdx].z,
            );
            const flat = (
                vertices[middleIdx].z == extremeZ &&
                vertices[bottomLeftIdx].z == extremeZ &&
                vertices[bottomRightIdx].z == extremeZ &&
                vertices[topLeftIdx].z == extremeZ &&
                vertices[topRightIdx].z == extremeZ
            )
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
        getThreeGeometry: () => geometry,
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
