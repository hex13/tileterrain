import { createTerrain } from '../src/createTerrain.js';
import * as THREE from 'three';
import * as assert from 'assert';

const Vector3 = THREE.Vector3;

const z0 = 0;
const tileSize = 7;


const createLegacyThreeVertices = (geometry) => {
    const vertices = [];
    const arr = geometry.getAttribute('position').array;
    for (let idx = 0; idx < arr.length; idx += 3) {
        vertices.push(new THREE.Vector3(arr[idx], arr[idx + 1], arr[idx + 2]));
    }
    return vertices;
};

describe('TileTerrain', () => {
    for (let columns = 1; columns < 20; columns++) {
        for (let rows = 1; rows < 20; rows++) {
            describe(`createTileTerrain columns=${columns} rows=${rows}`, () => {

                let terrain;
                let geometry;
                let vertices;

                beforeEach((done) => {
                    let isDone = false;
                    vertices = null;
                    terrain = createTerrain({
                        tileSize,
                        columns,
                        rows,
                        shouldUseIndices: true,
                        use: {
                            THREE,
                        },
                        onChange({ geometry }) {
                            vertices = createLegacyThreeVertices(geometry);
                            if (!isDone) {
                                isDone = true;
                                done();
                            }
                        }
                    });
                });

                it('it should create correct vertices', () => {
                    assert.strictEqual(vertices.length,
                        columns * rows // middle points
                        + (columns + 1) * (rows + 1) // grid
                    );

                    const bottomLeftX = 0;
                    const bottomLeftY = 0;

                    // bottom left tile: bottom edge
                    assert.deepStrictEqual(vertices[0], new Vector3(bottomLeftX, bottomLeftY, z0));
                    assert.deepStrictEqual(vertices[1], new Vector3(bottomLeftX + tileSize, bottomLeftY, z0));

                    // bottom left tile: top edge
                    assert.deepStrictEqual(vertices[2 * columns + 1], new Vector3(bottomLeftX, bottomLeftY + tileSize, z0));
                    assert.deepStrictEqual(vertices[2 * columns + 1 + 1], new Vector3(bottomLeftX + tileSize, bottomLeftY + tileSize, z0));

                    // bottom left tile: middle
                    assert.deepStrictEqual(vertices[columns + 1], new Vector3(bottomLeftX + tileSize / 2, bottomLeftY + tileSize / 2, z0));
                });
            });

        }
    }

    describe('raise', () => {
        const columns = 5;
        const rows = 5;
        let terrain;
        let geometry;

        before(done => {
            let isDone = false;
            terrain = createTerrain({
                tileSize,
                columns,
                rows,
                shouldUseIndices: true,
                use: {
                    THREE,
                },
                onChange(d) {
                    geometry = d.geometry;
                    if (!isDone) {
                        isDone = true;
                        done();
                    }
                },
            });
        });
        it('should change coords of vertices', () => {
            let vertices;
            const amount = 5;
            terrain.raise({x: 2, y: 2}, amount);
            const x = 2;
            const y = 2;
            let idx;
            idx = (2 * columns + 1) * y + x;

            vertices = createLegacyThreeVertices(geometry);

            // bottom-left vertex of affected tile
            assert.deepStrictEqual(vertices[idx], new Vector3(x * tileSize, y * tileSize, z0 + amount));

            // bottom-right vertex of affected tile
            assert.deepStrictEqual(vertices[idx + 1], new Vector3((x + 1) * tileSize, y * tileSize, z0 + amount));

            // top-left vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns * 2 + 1], new Vector3(x * tileSize, (y + 1) * tileSize, z0 + amount));

            // top-right vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns * 2 + 2], new Vector3((x + 1) * tileSize, (y + 1) * tileSize, z0 + amount));

            // middle vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns + 1], new Vector3((x + 0.5) * tileSize, (y + 0.5) * tileSize, z0 + amount));

        })
    })

});