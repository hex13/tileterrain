# Tile terrain for Three.js

- creates a Three geometry  
- displays grid/edges (`createLines`)
- `raise` method for raising terrain at given tile (use negative values for lower terrain)

Example:
```
import { createTerrain } from 'tileterrain';
//...
const terrain = createTerrain({
   tile: {x:0,y:0,z:0},
   rows: 10, columns: 10,
   tileSize: 5,
});

const material = HERE CREATE THREE MATERIAL
const mesh = new THREE.Mesh(terrain.getThreeGeometry(), material);

```
No more docs for now. You can look into source code. Module works but API can change.

Module was extracted from bigger project: https://www.looptile.com/ It's a 3D tile editor.

![Screenshot](screenshot1.jpg)
