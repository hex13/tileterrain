import { createTerrain } from '../src/createTerrain';
import * as THREE from 'three';
import * as assert from 'assert';

const Vector3 = THREE.Vector3;

const z0 = 123;
const tileSize = 7;



describe('TileTerrain', () => {
    for (let columns = 1; columns < 30; columns++) {
        for (let rows = 1; rows < 30; rows++) {
            describe(`createTileTerrain columns=${columns} rows=${rows}`, () => {

                let terrain;
                let geometry;
                let vertices;

                beforeEach(() => {
                    terrain = createTerrain({
                        tile: {x: 13, y: 2, z: z0},
                        tileSize,
                        columns,
                        rows,
                    });
                    geometry = terrain.getThreeGeometry();
                    vertices = geometry.vertices;
                });

                it('it should create correct vertices', () => {
                    assert.strictEqual(vertices.length,
                        columns * rows // middle points
                        + (columns + 1) * (rows + 1) // grid
                    );

                    const bottomLeftX = - tileSize * columns / 2;
                    const bottomLeftY = - tileSize * rows / 2;

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
        it('should change coords of vertices', () => {
            const columns = 5;
            const rows = 5;
            const terrain = createTerrain({
                tile: {x: 13, y: 2, z: z0},
                tileSize,
                columns,
                rows,
            });
            const geometry = terrain.getThreeGeometry();
            const vertices = geometry.vertices;
            const amount = 5;
            terrain.raise({x: 2, y: 2}, amount);
            const x = 2;
            const y = 2;
            let idx;
            idx = (2 * columns + 1) * y + x;

            // bottom-left vertex of affected tile
            assert.deepStrictEqual(vertices[idx], new Vector3(-tileSize / 2, -tileSize / 2, z0 + amount));
            // bottom-right vertex of affected tile
            assert.deepStrictEqual(vertices[idx + 1], new Vector3(tileSize / 2, -tileSize / 2, z0 + amount));

            // top-left vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns * 2 + 1], new Vector3(-tileSize / 2, tileSize / 2, z0 + amount));
            // top-right vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns * 2 + 2], new Vector3(tileSize / 2, tileSize / 2, z0 + amount));

            // middle vertex of affected tile
            assert.deepStrictEqual(vertices[idx + columns + 1], new Vector3(0, 0, z0 + amount));

        })

    })

});