import {
  AmbientLight, BoxGeometry, BufferGeometry, CatmullRomCurve3, CylinderGeometry, DirectionalLight,
  Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  OrthographicCamera, Scene, SphereGeometry, TubeGeometry, Vector3, WebGLRenderer,
} from 'three';

function buildPagoda(scene) {
  const model = new Group();
  scene.add(model);
  const glazedTiles = ['#a76719', '#bf831f', '#ce932a', '#b4781c'].map(color =>
    new MeshStandardMaterial({ color, roughness: 0.49 }),
  );
  const material = (color) => new MeshStandardMaterial({ color, roughness: 0.86 });
  const wood = material('#8e2524');
  const rail = material('#8b2e26');
  const limestone = material('#c7aa84');
  const sandstone = material('#e6cda4');
  const plaster = material('#f0d39c');
  const gold = new MeshStandardMaterial({ color: '#e1a84a', roughness: 0.42, metalness: 0.22 });
  const windowPane = material('#bd753e');
  const door = material('#5a2026');
  const lanternRed = material('#b82c2c');
  const plaque = material('#173b55');
  const jade = material('#236b63');
  const blue = material('#254f77');

  function mesh(geometry, surface, x, y, z) {
    const object = new Mesh(geometry, surface);
    object.position.set(x, y, z);
    model.add(object);
    return object;
  }
  const box = (w, h, d, x, y, z, surface) => mesh(new BoxGeometry(w, h, d), surface, x, y, z);
  const post = (r, h, x, y, z, surface) => mesh(new CylinderGeometry(r, r * 1.05, h, 10), surface, x, y, z);

  const sphere = new SphereGeometry(1, 12, 8);
  const ornament = (x, y, z, width, height, depth, surface) => {
    const object = mesh(sphere, surface, x, y, z);
    object.scale.set(width, height, depth);
  };
  function trim(points, radius) {
    const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
    mesh(new TubeGeometry(curve, points.length * 2, radius, 5, false), gold, 0, 0, 0);
  }

  // Glazed tiles follow a curved hip roof. The ends of each eave rise toward its corners.
  function roof(w, d, y, rise) {
    const topWidth = w * 0.49;
    const sides = [
      (u, t) => [u * (topWidth + (w - topWidth) * t), d * t],
      (u, t) => [w - (w - topWidth) * (1 - t), -u * d * t],
      (u, t) => [-u * (topWidth + (w - topWidth) * t), -d * t],
      (u, t) => [-w + (w - topWidth) * (1 - t), u * d * t],
    ];
    const point = (side, u, t) => {
      const [x, z] = sides[side](u, t);
      return [x, y + rise * (1 - t) ** 1.65 + 0.31 * t ** 3 * Math.abs(u) ** 7, z];
    };
    for (let side = 0; side < 4; side += 1) {
      const vertices = [];
      const geometry = new BufferGeometry();
      const tileCount = side % 2 ? 10 : 20;
      for (let tile = 0; tile < tileCount; tile += 1) {
        const start = vertices.length / 3;
        const left = -1 + 2 * tile / tileCount;
        const right = -1 + 2 * (tile + 1) / tileCount;
        for (let band = 0; band < 5; band += 1) {
          const inner = band / 5;
          const outer = (band + 1) / 5;
          const a = point(side, left, inner);
          const b = point(side, right, inner);
          const c = point(side, left, outer);
          const e = point(side, right, outer);
          vertices.push(...a, ...c, ...b, ...b, ...c, ...e);
        }
        const a = point(side, left, 1);
        const b = point(side, right, 1);
        const lower = ([x, height, z]) => [x, height - 0.11, z];
        vertices.push(...a, ...lower(a), ...b, ...b, ...lower(a), ...lower(b));
        geometry.addGroup(start, 30, (tile * 7 + side) % glazedTiles.length);
        geometry.addGroup(start + 30, 6, 0);
      }
      geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
      geometry.computeVertexNormals();
      mesh(geometry, glazedTiles, 0, 0, 0);
      trim(Array.from({ length: 13 }, (_, i) => point(side, i / 6 - 1, 1)), 0.029);
      trim(Array.from({ length: 7 }, (_, i) => point(side, 1, i / 6)), 0.022);
      const [tipX, tipY, tipZ] = point(side, 1, 1);
      trim([
        [tipX * 0.98, tipY - 0.04, tipZ * 0.98],
        [tipX, tipY, tipZ],
        [tipX * 1.026, tipY + 0.065, tipZ * 1.017],
        [tipX * 1.044, tipY + 0.19, tipZ * 1.023],
      ], 0.032);
    }
    box(topWidth * 2 + 0.2, 0.10, 0.14, 0, y + rise + 0.03, 0, glazedTiles[0]);
    for (const sign of [-1, 1]) {
      const x = sign * (topWidth + 0.04);
      ornament(x, y + rise + 0.10, 0, 0.13, 0.08, 0.072, gold);
      trim([[x, y + rise + 0.055, 0], [x + sign * 0.09, y + rise + 0.13, 0],
        [x + sign * 0.11, y + rise + 0.22, 0], [x + sign * 0.06, y + rise + 0.26, 0]], 0.035);
    }
    box(topWidth * 2 - 0.05, 0.027, 0.08, 0, y + rise + 0.094, 0, gold);
  }

  box(6.64, 0.16, 3.28, 0, 0.08, 0, limestone);
  box(6.07, 0.15, 2.89, 0, 0.23, 0, sandstone);
  box(5.68, 0.15, 2.65, 0, 0.38, 0, plaster);
  for (let step = 0; step < 4; step += 1) {
    box(2.12, 0.11, 0.29, 0, 0.08 + step * 0.10, 1.98 - step * 0.19, sandstone);
  }

  // Low stone balustrades frame the central ceremonial stair.
  for (const direction of [-1, 1]) {
    for (let i = 0; i < 5; i += 1) {
      const x = direction * (1.24 + i * 0.34);
      box(0.085, 0.24, 0.09, x, 0.55, 1.27, limestone);
    }
    box(1.48, 0.075, 0.13, direction * 1.92, 0.68, 1.27, sandstone);
    for (const x of [1.12, 2.69]) {
      box(0.16, 0.34, 0.17, direction * x, 0.60, 1.27, sandstone);
      ornament(direction * x, 0.80, 1.27, 0.082, 0.06, 0.082, sandstone);
    }
  }

  const tiers = [
    { width: 5.13, depth: 2.22, bottom: 0.45, height: 1.42, eave: 3.39 },
    { width: 3.60, depth: 1.63, bottom: 2.06, height: 1.00, eave: 2.42 },
    { width: 2.43, depth: 1.25, bottom: 3.36, height: 0.89, eave: 1.69 },
  ];
  tiers.forEach(({ width, depth, bottom, height, eave }, index) => {
    const middle = bottom + height / 2;
    const front = depth / 2;
    box(width, height, depth, 0, middle, 0, plaster);
    box(width + 0.14, 0.11, depth + 0.13, 0, bottom + 0.07, 0, sandstone);
    const beamY = bottom + height - 0.06;
    box(width + 0.22, 0.16, depth + 0.22, 0, beamY, 0, blue);
    box(width + 0.24, 0.046, depth + 0.24, 0, beamY + 0.046, 0, jade);
    box(width + 0.16, 0.035, depth + 0.17, 0, bottom + height - 0.13, 0, gold);
    const bays = index === 0 ? 5 : 3;
    const bay = width / bays;
    for (let i = 0; i <= bays; i += 1) {
      const x = -width / 2 + i * bay;
      post(index === 0 ? 0.086 : 0.061, height, x, middle, front + 0.051, wood);
      // Graduated brackets continue the painted beam rhythm above each column.
      box(0.15, 0.055, 0.14, x, beamY - 0.14, front + 0.06, jade);
      box(0.23, 0.06, 0.19, x, beamY - 0.095, front + 0.08, blue);
      box(0.32, 0.044, 0.20, x, beamY - 0.052, front + 0.09, jade);
      box(0.16, 0.018, 0.025, x, beamY - 0.052, front + 0.198, gold);
      box(0.17, 0.09, 0.18, x, bottom + 0.10, front + 0.045, limestone);
      if (i === bays) continue;
      const opening = x + bay / 2;
      const mainDoor = index === 0 && i === Math.floor(bays / 2);
      const openingHeight = mainDoor ? height * 0.82 : height * 0.54;
      const openingY = mainDoor ? bottom + openingHeight / 2 : middle;
      box(bay * 0.75, openingHeight + 0.055, 0.062, opening, openingY, front + 0.04, wood);
      box(bay * 0.66, openingHeight, 0.035, opening, openingY, front + 0.082, mainDoor ? door : windowPane);
      box(0.027, openingHeight, 0.02, opening, openingY, front + 0.107, rail);
      if (!mainDoor) {
        for (const offset of [-0.17, 0.17]) {
          box(0.018, openingHeight, 0.02, opening + bay * offset, openingY, front + 0.107, rail);
        }
        box(bay * 0.66, 0.025, 0.02, opening, openingY, front + 0.107, rail);
      } else {
        for (const offset of [-0.075, 0.075]) {
          ornament(offset, openingY, front + 0.13, 0.035, 0.035, 0.035, gold);
        }
      }
    }
    for (const z of [-front + 0.08, 0, front - 0.08]) {
      box(0.12, height, 0.10, width / 2 + 0.02, middle, z, wood);
    }
    for (const z of [-depth / 4, depth / 4]) {
      box(0.064, height * 0.57, depth * 0.34, width / 2 + 0.02, middle, z, wood);
      box(0.035, height * 0.49, depth * 0.28, width / 2 + 0.066, middle, z, windowPane);
    }
    if (index === 0) {
      box(1.20, 0.24, 0.095, 0, bottom + height - 0.16, front + 0.14, gold);
      box(1.10, 0.16, 0.025, 0, bottom + height - 0.16, front + 0.195, plaque);
      ornament(0, bottom + height - 0.16, front + 0.218, 0.08, 0.046, 0.013, gold);
      for (const x of [-1.55, 1.55]) {
        const y = bottom + height - 0.38;
        const z = front + 0.28;
        post(0.017, 0.22, x, y + 0.20, z, gold);
        ornament(x, y, z, 0.14, 0.16, 0.14, lanternRed);
        post(0.085, 0.035, x, y + 0.133, z, gold);
        post(0.071, 0.037, x, y - 0.13, z, gold);
        post(0.022, 0.11, x, y - 0.203, z, gold);
      }
    }
    roof(eave, front + 0.48, bottom + height - 0.015, index === 0 ? 0.74 : 0.65);
  });

  post(0.21, 0.11, 0, 5.03, 0, gold);
  ornament(0, 5.14, 0, 0.14, 0.10, 0.14, gold);
  post(0.066, 0.16, 0, 5.25, 0, gold);
  ornament(0, 5.38, 0, 0.091, 0.12, 0.091, gold);
}

export function mountPagoda(canvas) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0, 0);
  const scene = new Scene();
  scene.add(new AmbientLight(0xffe8ca, 0.58), new HemisphereLight(0xfff1df, 0xd3a586, 1.22));
  const sun = new DirectionalLight('#fff3e0', 2.3);
  sun.position.set(-4, 7, 5);
  scene.add(sun);
  buildPagoda(scene);

  const camera = new OrthographicCamera(-4, 4, 3.2, -3.2, 0.1, 45);
  camera.position.set(4.1, 5.9, 14);
  camera.lookAt(0, 2.66, 0);

  function render() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!width || !height || renderer.getContext().isContextLost()) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    const halfWidth = 3.84;
    const halfHeight = Math.max(3.03, halfWidth * height / width);
    camera.left = -halfHeight * width / height;
    camera.right = -camera.left;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  const observer = new ResizeObserver(render);
  observer.observe(canvas);
  render();

  return {
    render,
    dispose() {
      observer.disconnect();
      const materials = new Set();
      scene.traverse(object => {
        object.geometry?.dispose();
        if (object.material) [object.material].flat().forEach(surface => materials.add(surface));
      });
      materials.forEach(surface => surface.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
