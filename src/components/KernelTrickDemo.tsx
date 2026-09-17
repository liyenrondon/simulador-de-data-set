import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Layers, Play, Pause, RotateCcw, Info, ArrowUpRight } from 'lucide-react';

export const KernelTrickDemo: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [liftFactor, setLiftFactor] = useState<number>(0); // 0 = 2D plano, 1 = completamente elevado a 3D
  const [isAutoAnimating, setIsAutoAnimating] = useState<boolean>(false);
  const [selectedKernelType, setSelectedKernelType] = useState<'rbf' | 'poly'>('rbf');

  // Generar datos circulares sintéticos inspirados en precios concéntricos:
  // Centro (High Value / Downtown Luxury) vs Anillo Exterior (Standard Suburbia)
  const syntheticPoints = useRef<{ x: number; y: number; label: 1 | -1; r: number }[]>([]);

  if (syntheticPoints.current.length === 0) {
    const pts: { x: number; y: number; label: 1 | -1; r: number }[] = [];
    // Centro: 35 casas de lujo en el centro
    for (let i = 0; i < 35; i++) {
      const angle = (i / 35) * Math.PI * 2 + Math.random() * 0.2;
      const r = Math.random() * 2.8;
      pts.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        label: 1,
        r,
      });
    }
    // Anillo exterior: 55 casas suburbanas
    for (let i = 0; i < 55; i++) {
      const angle = (i / 55) * Math.PI * 2 + Math.random() * 0.15;
      const r = 4.2 + Math.random() * 3.2;
      pts.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        label: -1,
        r,
      });
    }
    syntheticPoints.current = pts;
  }

  useEffect(() => {
    let animId: number;
    if (isAutoAnimating) {
      const interval = setInterval(() => {
        setLiftFactor((prev) => {
          if (prev >= 1) {
            setIsAutoAnimating(false);
            return 1;
          }
          return Math.min(1, prev + 0.02);
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isAutoAnimating]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 720;
    const height = 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 14, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Luces
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dLight.position.set(15, 25, 15);
    scene.add(dLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Rejilla de base 2D (plano z=0)
    const gridHelper = new THREE.GridHelper(16, 16, 0x475569, 0x1e293b);
    gridHelper.position.y = 0;
    rootGroup.add(gridHelper);

    // Crear esferas para las viviendas
    const sphereGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const posMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      roughness: 0.2,
    });
    const negMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xd97706,
      roughness: 0.2,
    });

    const spheres: { mesh: THREE.Mesh; p: { x: number; y: number; label: 1 | -1; r: number } }[] = [];

    syntheticPoints.current.forEach((p) => {
      const mesh = new THREE.Mesh(sphereGeom, p.label === 1 ? posMat : negMat);
      rootGroup.add(mesh);
      spheres.push({ mesh, p });
    });

    // Plano de corte separador en 3D (aparece a medida que liftFactor aumenta)
    const planeGeom = new THREE.PlaneGeometry(16, 16);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: Math.max(0, (liftFactor - 0.2) * 0.5),
      side: THREE.DoubleSide,
      roughness: 0.1,
    });
    const cutPlane = new THREE.Mesh(planeGeom, planeMat);
    cutPlane.rotation.x = -Math.PI / 2;
    cutPlane.position.y = selectedKernelType === 'rbf' ? 2.6 : 3.8;
    rootGroup.add(cutPlane);

    const cutWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(planeGeom),
      new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: Math.max(0, liftFactor * 0.8),
      })
    );
    cutPlane.add(cutWire);

    // Mouse drag para rotar
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rootGroup.rotation.y += dx * 0.008;
      rootGroup.rotation.x += dy * 0.008;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => (isDragging = false);

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animación continua y posicionamiento según liftFactor
    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // Posicionar esferas según z = phi(x, y)
      spheres.forEach(({ mesh, p }) => {
        let zLift = 0;
        if (selectedKernelType === 'rbf') {
          // RBF: z = 6 * exp(-0.08 * r^2)
          zLift = 6.2 * Math.exp(-0.085 * (p.x * p.x + p.y * p.y));
        } else {
          // Polinomial: z = 0.15 * (x^2 + y^2)
          zLift = 0.18 * (p.x * p.x + p.y * p.y);
        }

        mesh.position.x = p.x;
        mesh.position.z = p.y;
        mesh.position.y = zLift * liftFactor;
      });

      planeMat.opacity = Math.max(0, (liftFactor - 0.15) * 0.45);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      camera.aspect = nw / height;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [liftFactor, selectedKernelType]);

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Cabecera didáctica */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Laboratorio del "Truco del Núcleo" (Kernel Trick)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Observa cómo datos imposibles de separar con una línea recta en 2D se vuelven linealmente separables al proyectarlos a una dimensión superior.
          </p>
        </div>

        {/* Selector de tipo de Kernel */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setSelectedKernelType('rbf')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedKernelType === 'rbf'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kernel RBF Gaussiano
          </button>
          <button
            onClick={() => setSelectedKernelType('poly')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedKernelType === 'poly'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kernel Polinomial (x² + y²)
          </button>
        </div>
      </div>

      {/* Controles de elevación dimensional interactivos */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            id="anim-kernel-btn"
            onClick={() => {
              if (liftFactor >= 1) setLiftFactor(0);
              setIsAutoAnimating(!isAutoAnimating);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg transition-all"
          >
            {isAutoAnimating ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Animar Proyección Φ(x)
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsAutoAnimating(false);
              setLiftFactor(0);
            }}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Reiniciar a 2D plano"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar a 2D
          </button>
        </div>

        {/* Control deslizante manual */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-xs text-slate-400 whitespace-nowrap">Plano 2D</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={liftFactor}
            onChange={(e) => {
              setIsAutoAnimating(false);
              setLiftFactor(parseFloat(e.target.value));
            }}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <span className="text-xs text-purple-400 font-semibold whitespace-nowrap">
            Espacio 3D Φ(x) ({Math.round(liftFactor * 100)}%)
          </span>
        </div>
      </div>

      {/* Visor 3D Three.js */}
      <div className="relative w-full h-[450px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
        <div ref={mountRef} className="w-full h-full" />

        {/* Estado en pantalla */}
        <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 max-w-xs pointer-events-none backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 mb-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            {liftFactor === 0
              ? 'Espacio Original (2D No Separable)'
              : liftFactor < 0.5
              ? 'Elevando coordenadas con transformación Φ...'
              : 'Espacio Transformado: ¡Separable por un Hiperplano Plano!'}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {liftFactor < 0.4
              ? 'En 2D, ninguna línea recta puede aislar el grupo central verde del anillo naranja sin cometer decenas de errores.'
              : '¡Eureka! Al elevar los puntos a la 3ª dimensión, un plano recto azul (hiperplano) corta limpiamente entre las dos clases.'}
          </p>
        </div>

        {/* Leyenda */}
        <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 pointer-events-none backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span>Casas Centro Urbano (Alta Gama)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 inline-block shadow-[0_0_8px_rgba(249,115,22,0.7)]" />
            <span>Casas Periferia (Estándar)</span>
          </div>
          {liftFactor > 0.2 && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2 bg-sky-400/50 border border-sky-400 inline-block" />
              <span className="text-sky-300 font-semibold">Hiperplano Separador 3D</span>
            </div>
          )}
        </div>
      </div>

      {/* Explicación matemática simplificada */}
      <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-4 text-xs text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong className="text-purple-300 block mb-1 font-semibold flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            ¿Cuál es el "Truco"? (The Kernel Trick)
          </strong>
          <p className="text-slate-400 leading-relaxed">
            Calcular explícitamente las coordenadas en dimensiones infinitas sería computacionalmente imposible y lentísimo.
            El <strong className="text-slate-200">Truco del Núcleo</strong> demuestra que solo necesitamos calcular el producto punto{' '}
            <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-purple-300">K(x, z) = ⟨Φ(x), Φ(z)⟩</code> directamente en el espacio original.
          </p>
        </div>

        <div>
          <strong className="text-purple-300 block mb-1 font-semibold">
            Fórmulas de los Kernels Populares:
          </strong>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
            <div>
              <span className="text-sky-400">Lineal:</span> K(x, z) = x · z
            </div>
            <div>
              <span className="text-emerald-400">RBF / Gaussiano:</span> K(x, z) = exp(-γ ||x - z||²)
            </div>
            <div>
              <span className="text-amber-400">Polinomial:</span> K(x, z) = (x · z + c)ᵈ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
