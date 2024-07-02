# Tile terrain for Three.js

- creates a Three geometry  
- displays grid/edges (`createLines`)
- `raise` method for raising terrain at given tile (use negative values for lower terrain)

Example:
```js
   const material = new THREE.MeshLambertMaterial({color: '#33ff33', flatShading: true, });
   const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);

   const terrain = createTerrain({
      tile: {x:0,y:0,z:0},
      rows: 32, columns: 32,
      tileSize: 1,
      onChange: ({ geometry }) => {
         mesh.geometry = geometry;
      },
      use: {
         THREE,
      },
   });
   terrain.raise({x: 2, y: 3});
   terrain.raise({x: 5, y: 5});
   terrain.raise({x: 20, y: 20});
   setTimeout(() => {
      terrain.raise({x: 21, y: 20});
      terrain.raise({x: 20, y: 20}, 3);
   }, 2000);

```
No more docs for now. You can look into source code. Module works but API can change.

Module was extracted from bigger project: https://looptile.netlify.app/ It's a 3D tile editor.

![Screenshot](screenshot1.jpg)
