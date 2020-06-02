import * as THREE from 'three';

let affected = Object.create(null);

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
    }) {
    let onChange;
    const geometry = new THREE.Geometry();
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
        
            const idx = geometry.vertices.length;
            geometry.vertices.push(...[
                new THREE.Vector3(xFrom, yFrom, z)
            ]);                    
        }

        if (y < GROUND_H) for (let x = 0; x < GROUND_W; x++) {
            const xFrom = x * tileSize - tileSize * GROUND_W / 2;
            const yFrom = y * tileSize - tileSize * GROUND_H / 2;
            const xMiddle = xFrom + tileSize / 2;
            const yMiddle = yFrom + tileSize / 2;

            const z = tile.z;
        
            geometry.vertices.push(...[
                new THREE.Vector3(xMiddle, yMiddle, z),
            ]);                    
        }
    }



    for (let y = 0; y < GROUND_H; y++) {
        for (let x = 0; x < GROUND_W; x++) {
            const bottomLeftIdx = (2 * GROUND_W + 1) * y + x;
            const bottomRightIdx =  bottomLeftIdx + 1;
            const middleIdx =  bottomLeftIdx + GROUND_W + 1;
            const topLeftIdx =  middleIdx + GROUND_W;
            const topRightIdx =  topLeftIdx + 1;
            const faces = [
                new THREE.Face3(bottomLeftIdx, bottomRightIdx, middleIdx, new THREE.Vector3(0, 1, 0), 0xffffff, 0),
                new THREE.Face3(bottomLeftIdx, middleIdx, topLeftIdx, new THREE.Vector3(0, 1, 0), 0xffffff, 0),
                new THREE.Face3(middleIdx, topRightIdx, topLeftIdx, new THREE.Vector3(0, 1, 0), 0xffffff, 0),
                new THREE.Face3(middleIdx, bottomRightIdx, topRightIdx, new THREE.Vector3(0, 1, 0), 0xffffff, 0),
            ];

            geometry.faces.push(...faces);

            tiles[x][y] = {
                faces,
                vertices: {
                    bottomLeftIdx,
                    bottomRightIdx,
                    middleIdx,
                    topLeftIdx,
                    topRightIdx,
                }
            }

            geometry.faceVertexUvs[0].push(...createFaceVertexUvs({
                bottomLeftUv: {x: x / GROUND_W, y: y / GROUND_H},
                bottomRightUv: {x: (x + 1) / GROUND_W, y: y / GROUND_H},
                topLeftUv: {x: x / GROUND_W, y: (y + 1) / GROUND_H},
                topRightUv: {x: (x + 1) / GROUND_W, y: (y + 1) / GROUND_H},
                middleUv: {x: (x + 0.5) / GROUND_W, y: (y + 0.5) / GROUND_H},
            }))
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

    function _raise({ x, y }, amount = tileSize, r = 0) {
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
            const { bottomLeftIdx, bottomRightIdx, middleIdx, topLeftIdx, topRightIdx } = computeIndexes(x + _x, y + _y);

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
        onChange && onChange();
    }

    geometry.uvsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;

    geometry.uvsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.cloneTile = tile => {

    };
    geometry.tiles = tiles;

    const createGridGeometry = () => {
        const edges = new THREE.Geometry();
        for (let x = 0; x < geometry.tiles.length; x++) {
            for (let y = 0; y < geometry.tiles[x].length; y++) {
                const geomTile = geometry.tiles[x][y];

                const bottomLeft = geometry.vertices[geomTile.vertices.bottomLeftIdx];
                const bottomRight = geometry.vertices[geomTile.vertices.bottomRightIdx];
                const topLeft = geometry.vertices[geomTile.vertices.topLeftIdx];
                const topRight = geometry.vertices[geomTile.vertices.topRightIdx];
                const middle = geometry.vertices[geomTile.vertices.middleIdx];

                edges.vertices.push(bottomLeft);
                edges.vertices.push(bottomRight);
                edges.vertices.push(bottomLeft);
                edges.vertices.push(topLeft);

                // diagonal edges
                const threshold = 0.1;
                if ( Math.abs((topRight.z + bottomLeft.z) / 2 - middle.z) > threshold) {
                    edges.vertices.push(topLeft);
                    edges.vertices.push(middle);
                    edges.vertices.push(middle);
                    edges.vertices.push(bottomRight);
                }
                if (Math.abs((topLeft.z + bottomRight.z) / 2 - middle.z) > threshold) {
                    edges.vertices.push(bottomLeft);
                    edges.vertices.push(middle);
                    edges.vertices.push(middle);
                    edges.vertices.push(topRight);
                }
            }
        }
        return edges;
    }

    function copyTiles(targetGeom, tile, tile2, getMaterial = () => 0) {
        targetGeom.vertices = [];
        targetGeom.faces = [];
        let idx = 0;
        for (let y = tile.y; y <= tile2.y; y++) {
            for (let x = tile.x; x <= tile2.x; x++) {

                const geomTile = geometry.tiles[x][y];

                geomTile.faces.forEach(face => {
                    targetGeom.vertices.push(...[
                        geometry.vertices[face.a],
                        geometry.vertices[face.b],
                        geometry.vertices[face.c],
                    ]);
                });

                const mat = getMaterial(x,y);
                targetGeom.faces.push(...[
                    new THREE.Face3(idx, idx + 1, idx + 2, undefined, undefined, mat),
                    new THREE.Face3(idx + 3, idx + 4, idx + 5, undefined, undefined, mat),
                    new THREE.Face3(idx + 6, idx + 7, idx + 8, undefined, undefined, mat),
                    new THREE.Face3(idx + 9, idx + 10, idx + 11, undefined, undefined, mat),
                ]);
                idx += 4 * 3; // 4 faces, each face has 3 vertices

                targetGeom.faceVertexUvs[0].push(...createFaceVertexUvs({
                    bottomLeftUv: {x: 0, y: 0},
                    bottomRightUv: {x: 1, y: 0},
                    topLeftUv: {x: 0, y: 1},
                    topRightUv: {x: 1, y: 1},
                    middleUv: {x: 0.5, y: 0.5},

                }))
            }
        }

        targetGeom.facesNeedUpdate;
        targetGeom.verticesNeedUpdate;
        targetGeom.normalsNeedUpdate = true;

        targetGeom.elementsNeedUpdate = true;
        targetGeom.computeFaceNormals();
        targetGeom.computeVertexNormals();
    }

    return {
        getThreeGeometry: () => geometry,
        raise: (...args) => {
            _raise(...args);
            geometry.uvsNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
            geometry.verticesNeedUpdate = true;
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();
        },
        clearAffectedList: () => {
            affected = Object.create(null);
        },
        createLines: () => {
            let lines1, lines2;

            const edges = createGridGeometry();
            const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0xffffaa}));

            lines.rotation.x = - Math.PI / 2;
            lines.position.y += 0.11;
            lines.material.opacity = 0.06;
            lines.material.transparent = true;
            lines1 = lines;

            const group = new THREE.Group();

            group.add(lines1);
            group.add((_ => {
                const edges = new THREE.EdgesGeometry(geometry);
                const lines = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: 0x000000}));

                lines.rotation.x = - Math.PI / 2;
                lines.position.y += 0.13;
                lines.material.opacity = 0.3;
                lines.material.transparent = true;
                lines2 = lines;
                return lines;
            })());

            let timeout;

            onChange = () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    let edges;
                    lines2.geometry.dispose();
                    edges = new THREE.EdgesGeometry(geometry);
                    lines2.geometry = edges;

                    lines1.geometry.dispose();
                    edges = createGridGeometry();
                    lines1.geometry = edges;
                }, 150);

            };
            return group;
        },
        copyTiles,
        createGrid: createGridGeometry,
    }
}
