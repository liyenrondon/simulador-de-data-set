import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FeatureKey, HousingRecord, SVMModelResult } from '../types';
import { FEATURES_METADATA, normalizeFeature } from '../data/housingDataset';
import { RotateCw, ZoomIn, Eye, Sparkles, Home, Box, Info } from 'lucide-react';

interface SVMVisualizer3DProps {
  records: HousingRecord[];
  model: SVMModelResult;
  featureX: FeatureKey;
  featureY: FeatureKey;
  featureZ: FeatureKey;
  priceThreshold: number;
}

export const SVMVisualizer3D: React.FC<SVMVisualizer3DProps> = ({
  records,
  model,
  featureX,
  featureY,
  featureZ,
  priceThreshold,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<HousingRecord | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showMargins3D, setShowMargins3D] = useState<boolean>(true);
  const [showNormalVector, setShowNormalVector] = useState<boolean>(true);

  const metaX = FEATURES_METADATA[featureX];
  const metaY = FEATURES_METADATA[featureY];
  const metaZ = FEATURES_METADATA[featureZ];

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 720;
    const height = 480;

    // Escena, Cámara y Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 18, 28);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(20, 30, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf59e0b, 0.8);
    dirLight2.position.set(-20, -10, -20);
    scene.add(dirLight2);

    // Caja de coordenadas 3D delimitadora (Scale: [-10, 10] en x, y, z)
    const boxSize = 20;
    const boxGeom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxEdges = new THREE.EdgesGeometry(boxGeom);
    const boxLine = new THREE.LineSegments(
      boxEdges,
      new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 })
    );
    scene.add(boxLine);

    // Rejilla de piso
    const grid = new THREE.GridHelper(boxSize, 10, 0x475569, 0x1e293b);
    grid.position.y = -boxSize / 2;
    scene.add(grid);

    // Grupo para todos los elementos rotables por mouse
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Mapear normalizado [-1, 1] a coordenadas del mundo 3D [-9, 9]
    const mapTo3D = (rec: HousingRecord) => {
      const nx = normalizeFeature(rec[featureX], featureX);
      const ny = normalizeFeature(rec[featureY], featureY);
      const nz = normalizeFeature(rec[featureZ], featureZ);
      return new THREE.Vector3(nx * 9, ny * 9, nz * 9);
    };

    // Crear esferas para las viviendas
    const sphereGeom = new THREE.SphereGeometry(0.42, 16, 16);
    const svSphereGeom = new THREE.SphereGeometry(0.55, 16, 16);

    const posMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      roughness: 0.3,
      metalness: 0.2,
    });
    const negMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      roughness: 0.3,
      metalness: 0.2,
    });
    const svPosMaterial = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      roughness: 0.1,
      metalness: 0.4,
    });
    const svNegMaterial = new THREE.MeshStandardMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      roughness: 0.1,
      metalness: 0.4,
    });

    const houseMeshes: THREE.Mesh[] = [];
    const houseRecordMap = new Map<number, HousingRecord>();

    records.forEach((rec) => {
      const isSV = model.supportVectors.some((sv) => sv.id === rec.id);
      const isPos = rec.label === 1;

      let mat = isPos ? posMaterial : negMaterial;
      if (isSV) {
        mat = isPos ? svPosMaterial : svNegMaterial;
      }

      const mesh = new THREE.Mesh(isSV ? svSphereGeom : sphereGeom, mat);
      const pos = mapTo3D(rec);
      mesh.position.copy(pos);
      worldGroup.add(mesh);
      houseMeshes.push(mesh);
      houseRecordMap.set(mesh.id, rec);

      // Si es Vector de Soporte, añadir un aro de luz 3D
      if (isSV) {
        const ringGeom = new THREE.RingGeometry(0.65, 0.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xfbbf24,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.position.copy(pos);
        ring.lookAt(camera.position);
        worldGroup.add(ring);
      }
    });

    // Plano del Hiperplano en 3D: w0*x + w1*y + w2*z + b = 0
    // En espacio del mundo: x_norm = x_3d / 9, etc.
    const w0 = model.weights[0] || 0.1;
    const w1 = model.weights[1] || 0.1;
    const w2 = model.weights[2] || 0.1;
    const b = model.bias;

    // Normal del plano en espacio 3D
    const normal = new THREE.Vector3(w0 / 9, w1 / 9, w2 / 9).normalize();
    const planeCenter = normal.clone().multiplyScalar(-b / (normal.length() || 1));

    // Crear un plano 3D que corte la caja
    const planeGeom = new THREE.PlaneGeometry(26, 26);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.1,
      metalness: 0.5,
      depthWrite: false,
    });
    const hyperplaneMesh = new THREE.Mesh(planeGeom, planeMat);
    hyperplaneMesh.position.copy(planeCenter);
    hyperplaneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    worldGroup.add(hyperplaneMesh);

    // Contorno del hiperplano
    const planeEdges = new THREE.EdgesGeometry(planeGeom);
    const planeWire = new THREE.LineSegments(
      planeEdges,
      new THREE.LineBasicMaterial({ color: 0x7dd3fc, linewidth: 2 })
    );
    hyperplaneMesh.add(planeWire);

    // Planos de margen (+1 y -1)
    let posMarginMesh: THREE.Mesh | null = null;
    let negMarginMesh: THREE.Mesh | null = null;

    if (showMargins3D) {
      const marginOffset = 1 / (normal.length() || 1);

      const posMarginMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: true,
      });
      posMarginMesh = new THREE.Mesh(planeGeom, posMarginMat);
      posMarginMesh.position.copy(
        planeCenter.clone().add(normal.clone().multiplyScalar(marginOffset))
      );
      posMarginMesh.quaternion.copy(hyperplaneMesh.quaternion);
      worldGroup.add(posMarginMesh);

      const negMarginMat = new THREE.MeshBasicMaterial({
        color: 0xfb923c,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: true,
      });
      negMarginMesh = new THREE.Mesh(planeGeom, negMarginMat);
      negMarginMesh.position.copy(
        planeCenter.clone().add(normal.clone().multiplyScalar(-marginOffset))
      );
      negMarginMesh.quaternion.copy(hyperplaneMesh.quaternion);
      worldGroup.add(negMarginMesh);
    }

    // Flecha del Vector Normal w
    let arrowHelper: THREE.ArrowHelper | null = null;
    if (showNormalVector) {
      arrowHelper = new THREE.ArrowHelper(normal, planeCenter, 7, 0x38bdf8, 1.2, 0.6);
      worldGroup.add(arrowHelper);
    }

    // Interacción con mouse para rotar (Orbit simplificado)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Raycaster para detectar hover en esferas
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
      const intersects = raycaster.intersectObjects(houseMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const rec = houseRecordMap.get(hit.id);
        if (rec) setSelectedRecord(rec);
        renderer.domElement.style.cursor = 'pointer';
      } else {
        renderer.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
      }

      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      worldGroup.rotation.y += deltaX * 0.008;
      worldGroup.rotation.x += deltaY * 0.008;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(12, Math.min(50, camera.position.z + e.deltaY * 0.03));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    domEl.addEventListener('wheel', onWheel, { passive: false });

    // Loop de renderizado
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate) {
        worldGroup.rotation.y += 0.004;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newW = mountRef.current.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      domEl.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [records, model, featureX, featureY, featureZ, autoRotate, showMargins3D, showNormalVector]);

  return (
    <div className="w-full flex flex-col gap-3 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Barra superior de controles 3D */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Box className="w-4 h-4 text-sky-400" />
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            Espacio Tridimensional: {metaX.name} (X), {metaY.name} (Y), {metaZ.name} (Z)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            id="toggle-3d-rotate-btn"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            Auto-rotación
          </button>

          <button
            id="toggle-3d-margins-btn"
            onClick={() => setShowMargins3D(!showMargins3D)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showMargins3D
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Planos de Margen
          </button>

          <button
            id="toggle-3d-normal-btn"
            onClick={() => setShowNormalVector(!showNormalVector)}
            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              showNormalVector
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            Vector Normal w
          </button>
        </div>
      </div>

      {/* Contenedor WebGL 3D */}
      <div className="relative w-full h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 shadow-inner">
        <div ref={mountRef} className="w-full h-full" />

        {/* Guía de navegación */}
        <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-800/90 rounded-lg p-2.5 text-[11px] text-slate-400 pointer-events-none backdrop-blur-sm flex flex-col gap-1">
          <span className="text-slate-200 font-semibold flex items-center gap-1">
            <Info className="w-3 h-3 text-sky-400" />
            Navegación 3D Interactiva:
          </span>
          <span>• Arrastra con el ratón para rotar el espacio</span>
          <span>• Rueda del ratón para acercar / alejar zoom</span>
          <span>• Pasa el cursor por las casas para inspeccionarlas</span>
        </div>

        {/* Leyenda 3D */}
        <div className="absolute top-4 right-4 bg-slate-900/85 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 pointer-events-none backdrop-blur-sm flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span>Alta Gama (&gt; ${priceThreshold.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
            <span>Estándar (&le; ${priceThreshold.toLocaleString()})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 inline-block" />
            <span className="text-amber-300 font-semibold">Vectores de Soporte</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-sky-500/40 border border-sky-400 inline-block" />
            <span className="text-sky-300">Hiperplano Separador (Plano 2D en ℝ³)</span>
          </div>
        </div>

        {/* Tarjeta HUD de vivienda inspeccionada */}
        {selectedRecord && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl text-xs max-w-sm pointer-events-none backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-sky-400" />
                {selectedRecord.city}, {selectedRecord.state}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-semibold ${
                  selectedRecord.label === 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                }`}
              >
                {selectedRecord.label === 1 ? 'Alta Gama' : 'Estándar'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-slate-300 mb-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Precio:</span>
                <span className="font-bold text-emerald-400">${selectedRecord.price.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{metaX.name}:</span>
                <span>{selectedRecord[featureX]} {metaX.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{metaY.name}:</span>
                <span>{selectedRecord[featureY]} {metaY.unit}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">{metaZ.name}:</span>
                <span>{selectedRecord[featureZ]} {metaZ.unit}</span>
              </div>
            </div>

            {model.supportVectors.some((sv) => sv.id === selectedRecord.id) ? (
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Vector de Soporte: sostiene la inclinación del hiperplano 3D.</span>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px]">
                Punto interior: no ejerce fuerza de soporte sobre el plano separador.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Explicación pedagógica de la 3ª dimensión */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-100 block mb-1">
            ¿Por qué en 3D el Hiperplano es una lámina plana (2D)?
          </strong>
          <p className="leading-relaxed text-slate-400">
            En un espacio de <span className="text-slate-200">dimensión D</span>, un hiperplano separador siempre tiene{' '}
            <span className="text-slate-200">dimensión D - 1</span>. En 2D es una recta (1D); en 3D es una superficie plana (2D) descrita por{' '}
            <code className="text-sky-300 font-mono">w₁·x + w₂·y + w₃·z + b = 0</code>.
            Al agregar una tercera variable inmobiliaria, podemos separar viviendas que antes se solapaban en 2D.
          </p>
        </div>
      </div>
    </div>
  );
};
