import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { unzip } from 'fflate'

function Rendering3D() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const placeholderRef = useRef<THREE.Object3D | null>(null)
  const pmremRef = useRef<THREE.PMREMGenerator | null>(null)
  const envRef = useRef<THREE.Texture | null>(null)
  const managerRef = useRef<THREE.LoadingManager | null>(null)
  const assetMapRef = useRef<Record<string, string>>({})
  const filesHandlerRef = useRef<((files: FileList | null) => void) | null>(null)
  const ktx2Ref = useRef<KTX2Loader | null>(null)
  const dracoRef = useRef<DRACOLoader | null>(null)
  const [exposure, setExposure] = useState(1)
  const [bgColor, setBgColor] = useState('#202020')
  const [showGrid, setShowGrid] = useState(true)
  const [showGround, setShowGround] = useState(true)
  const [showAxes, setShowAxes] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [useEnv, setUseEnv] = useState(true)
  const [autoCenter, setAutoCenter] = useState(true)
  const [autoNormalize, setAutoNormalize] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)
  const axesRef = useRef<THREE.AxesHelper | null>(null)
  const initialCamRef = useRef<THREE.Vector3 | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [mtlUrl, setMtlUrl] = useState('')
  const localObj1Url = new URL('./obj-field/无标题_副本.obj', import.meta.url).href
  const localObj2Url = new URL('./obj-field/富阳傅宅原始地形(2)_副本.obj', import.meta.url).href
  const localObj3Url = new URL('./obj-field/富阳傅宅体块推敲_副本.obj', import.meta.url).href
  const localObj4Url = new URL('./obj-field/5f206b07041d4a6c96fd6f4879b8aa98.glb', import.meta.url).href


  useEffect(() => {
    const cw = mountRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1024)
    const mobile = cw < 768
    setIsMobile(mobile)
    setPanelOpen(!mobile)
  }, [])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    const vv = (typeof window !== 'undefined' && (window as any).visualViewport) ? (window as any).visualViewport : null
    const w = container.clientWidth || window.innerWidth
    const h = container.clientHeight || (vv ? Math.floor(vv.height) : window.innerHeight)
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(w, h)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = exposure
    renderer.shadowMap.enabled = true
    container.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    rendererRef.current = renderer

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(bgColor)
    sceneRef.current = scene

    const pmrem = new THREE.PMREMGenerator(renderer)
    pmremRef.current = pmrem
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    envRef.current = env
    scene.environment = useEnv ? env : null

    const manager = new THREE.LoadingManager()
    manager.setURLModifier(url => {
      const key = url.toLowerCase()
      const base = key.split('/').slice(-1)[0]
      return assetMapRef.current[key] || assetMapRef.current[base] || url
    })
    managerRef.current = manager

    const ktx2 = new KTX2Loader(manager)
    ktx2.setTranscoderPath('https://unpkg.com/three@0.181.2/examples/jsm/libs/basis/')
    ktx2.detectSupport(renderer)
    ktx2Ref.current = ktx2

    const draco = new DRACOLoader(manager)
    draco.setDecoderPath('https://unpkg.com/three@0.181.2/examples/jsm/libs/draco/')
    draco.setDecoderConfig({ type: 'js' })
    dracoRef.current = draco

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.5, 1000)
    camera.position.set(3, 2, 6)
    cameraRef.current = camera

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controlsRef.current = controls

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1)
    hemi.position.set(0, 1, 0)
    scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(5, 5, 5)
    dir.castShadow = true
    dir.shadow.mapSize.set(1024, 1024)
    dir.shadow.camera.near = 0.1
    dir.shadow.camera.far = 50
    dir.shadow.camera.left = -15
    dir.shadow.camera.right = 15
    dir.shadow.camera.top = 15
    dir.shadow.camera.bottom = -15
    scene.add(dir)

    const amb = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(amb)

    const grid = new THREE.GridHelper(50, 50, 0x666666, 0x333333)
    grid.visible = showGrid
      ; (grid.material as THREE.Material).depthWrite = false
      ; (grid.material as THREE.Material).depthTest = false
    grid.position.y = 0.001
    scene.add(grid)
    gridRef.current = grid

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1, metalness: 0 })
    groundMat.polygonOffset = true
    groundMat.polygonOffsetFactor = 4
    groundMat.polygonOffsetUnits = 4
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      groundMat
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.1
    ground.receiveShadow = true
    ground.visible = showGround
    scene.add(ground)
    groundRef.current = ground

    const axes = new THREE.AxesHelper(2)
    axes.visible = showAxes
    scene.add(axes)
    axesRef.current = axes

    const placeholder = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.2 })
    )
    placeholder.position.set(0, 0.5, 0)
    scene.add(placeholder)
    placeholderRef.current = placeholder

    let anim = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      anim = requestAnimationFrame(tick)
    }
    tick()

    const handleResize = () => {
      const vvLocal = (typeof window !== 'undefined' && (window as any).visualViewport) ? (window as any).visualViewport : null
      const cw = mountRef.current?.clientWidth || window.innerWidth
      const ch = mountRef.current?.clientHeight || (vvLocal ? Math.floor(vvLocal.height) : window.innerHeight)
      renderer.setPixelRatio(window.devicePixelRatio || 1)
      renderer.setSize(cw, ch)
      camera.aspect = cw / ch
      camera.updateProjectionMatrix()
      setIsMobile(cw < 768)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    if (vv) vv.addEventListener('resize', handleResize)
    const ro = (window as any).ResizeObserver ? new (window as any).ResizeObserver(() => handleResize()) : null
    if (ro) ro.observe(container)
    const onDragOver = (e: DragEvent) => { e.preventDefault() }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      const fl = e.dataTransfer?.files || null
      filesHandlerRef.current?.(fl)
    }
    container.addEventListener('dragover', onDragOver, { passive: false })
    container.addEventListener('drop', onDrop, { passive: false })

    return () => {
      cancelAnimationFrame(anim)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (vv) vv.removeEventListener('resize', handleResize)
      if (ro) ro.disconnect()
      container.removeEventListener('dragover', onDragOver)
      container.removeEventListener('drop', onDrop)
      controls.dispose()
      renderer.dispose()
      container?.removeChild(renderer.domElement)
      pmremRef.current?.dispose()
      ktx2Ref.current?.dispose()
      dracoRef.current?.dispose()
    }
  }, [exposure, bgColor, showGrid, showGround, showAxes, useEnv])

  useEffect(() => {
    const r = rendererRef.current
    if (r) r.toneMappingExposure = exposure
  }, [exposure])

  const registerAsset = (name: string, url: string) => {
    const lower = name.toLowerCase()
    assetMapRef.current[lower] = url
    const base = lower.split('/').slice(-1)[0]
    assetMapRef.current[base] = url
  }

  const clearModel = () => {
    const scene = sceneRef.current
    if (!scene || !modelRef.current) return
    scene.remove(modelRef.current)
    modelRef.current.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        mesh.geometry.dispose()
        const m = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        m.forEach(mat => {
          Object.values(mat).forEach(v => {
            const t = v as unknown as THREE.Texture
            if (t && (t as THREE.Texture).isTexture) t.dispose()
          })
          mat.dispose()
        })
      }
    })
    modelRef.current = null
  }

  const fitView = (root: THREE.Object3D) => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    const scene = sceneRef.current
    if (!camera || !controls || !scene) return
    const box = new THREE.Box3().setFromObject(root)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const center = sphere.center
    const radius = Math.max(sphere.radius, 1)
    const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))
    const dir = new THREE.Vector3(1, 0.6, 1).normalize()
    camera.position.copy(center.clone().add(dir.multiplyScalar(dist)))
    controls.target.copy(center)
    controls.update()
  }

  const centerView = () => {
    const root = modelRef.current
    if (!root) return
    fitView(root)
  }

  const alignToOrigin = () => {
    const root = modelRef.current
    if (!root) return
    const box = new THREE.Box3().setFromObject(root)
    const worldCenter = box.getCenter(new THREE.Vector3())
    const localCenter = root.worldToLocal(worldCenter.clone())
    root.position.sub(localCenter)
    fitView(root)
  }

  const loadFromObj = async (objUrl: string, materialUrl?: string) => {
    setError(null)
    setLoading(true)
    setProgress(0)
    clearModel()
    const objLoader = new OBJLoader(managerRef.current || undefined)
    if (materialUrl) {
      const mtlLoader = new MTLLoader(managerRef.current || undefined)
      const isBlob = materialUrl.startsWith('blob:')
      mtlLoader.setResourcePath(isBlob ? '' : new URL('.', materialUrl).href)
      mtlLoader.load(materialUrl, materials => {
        materials.preload()
        objLoader.setMaterials(materials)
        objLoader.load(objUrl, root => {
          const scene = sceneRef.current
          if (!scene) return
          root.traverse(o => {
            if ((o as THREE.Mesh).isMesh) {
              const mesh = o as THREE.Mesh
              const g = mesh.geometry as THREE.BufferGeometry
              const hasColor = !!g.getAttribute('color')
              if (!mesh.material) {
                mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide, vertexColors: hasColor })
              }
              mesh.castShadow = true
              mesh.receiveShadow = true
              if (g && !g.getAttribute('normal')) g.computeVertexNormals()
              if (wireframe) {
                const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
                mats.forEach(m => { (m as THREE.Material).wireframe = true })
              }
            }
          })
          modelRef.current = root
          scene.add(root)
          if (placeholderRef.current) {
            scene.remove(placeholderRef.current)
            placeholderRef.current = null
          }
          if (autoCenter) alignToOrigin()
          if (autoNormalize) normalizeScale(2)
          placeGroundBelowModel()
          fitView(root)
          setLoading(false)
        }, e => {
          const total = e.total || 100
          setProgress(Math.round((e.loaded / total) * 100))
        }, err => {
          setError(String(err))
          setLoading(false)
        })
      }, undefined, err => {
        setError(String(err))
        setLoading(false)
      })
    } else {
      objLoader.load(objUrl, root => {
        const scene = sceneRef.current
        if (!scene) return
        root.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh
            const g = mesh.geometry as THREE.BufferGeometry
            const hasColor = !!g.getAttribute('color')
            if (!mesh.material) {
              mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0.2, side: THREE.DoubleSide, vertexColors: hasColor })
            }
            mesh.castShadow = true
            mesh.receiveShadow = true
            if (g && !g.getAttribute('normal')) g.computeVertexNormals()
            if (wireframe) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
              mats.forEach(m => { (m as THREE.Material).wireframe = true })
            }
          }
        })
        modelRef.current = root
        scene.add(root)
        if (placeholderRef.current) {
          scene.remove(placeholderRef.current)
          placeholderRef.current = null
        }
        if (autoCenter) alignToOrigin()
        if (autoNormalize) normalizeScale(2)
        placeGroundBelowModel()
        fitView(root)
        setLoading(false)
      }, e => {
        const total = e.total || 100
        setProgress(Math.round((e.loaded / total) * 100))
      }, err => {
        setError(String(err))
        setLoading(false)
      })
    }
  }

  const loadFromUrl = async (u: string) => {
    if (!u) return
    const lower = u.split('?')[0].split('#')[0].toLowerCase()
    if (lower.endsWith('.obj')) {
      return loadFromObj(u, mtlUrl || undefined)
    }
    setError(null)
    setLoading(true)
    setProgress(0)
    clearModel()
    const loader = new GLTFLoader(managerRef.current || undefined)
    loader.setCrossOrigin('anonymous')
    if (ktx2Ref.current) loader.setKTX2Loader(ktx2Ref.current)
    if (dracoRef.current) loader.setDRACOLoader(dracoRef.current)
    if (MeshoptDecoder) loader.setMeshoptDecoder(MeshoptDecoder as any)
    loader.load(u, gltf => {
      const scene = sceneRef.current
      if (!scene) return
      const root = gltf.scene || gltf.scenes[0]
      modelRef.current = root
      scene.add(root)
      root.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh
          mesh.castShadow = true
          mesh.receiveShadow = true
          if (wireframe) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            mats.forEach(m => { (m as THREE.Material).wireframe = true })
          }
        }
      })
      if (placeholderRef.current) {
        scene.remove(placeholderRef.current)
        placeholderRef.current = null
      }
      if (autoCenter) alignToOrigin()
      if (autoNormalize) normalizeScale(2)
      placeGroundBelowModel()
      fitView(root)
      setLoading(false)
    }, e => {
      const total = e.total || 100
      setProgress(Math.round((e.loaded / total) * 100))
    }, err => {
      const msg = (err && (err as any).message) ? (err as any).message : String(err)
      setError(msg)
      setLoading(false)
    })
  }

  const onFilesChange = React.useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const arr = Array.from(files)
    const obj = arr.find(x => x.name.toLowerCase().endsWith('.obj'))
    const mtl = arr.find(x => x.name.toLowerCase().endsWith('.mtl'))
    arr.filter(x => /\.(png|jpg|jpeg|gif|bmp|webp|tga)$/i.test(x.name)).forEach(tex => {
      const url = URL.createObjectURL(tex)
      registerAsset(tex.name, url)
    })
    if (obj) {
      const objUrl = URL.createObjectURL(obj)
      const mtlUrlLocal = mtl ? URL.createObjectURL(mtl) : undefined
      loadFromObj(objUrl, mtlUrlLocal)
      return
    }
    const f = arr[0]
    const url = URL.createObjectURL(f)
    loadFromUrl(url)
  }, [loadFromObj, loadFromUrl])

  useEffect(() => { filesHandlerRef.current = onFilesChange }, [onFilesChange])

  const resetCamera = () => {
    const camera = cameraRef.current
    const controls = controlsRef.current
    if (!camera || !controls) return
    if (!initialCamRef.current) initialCamRef.current = new THREE.Vector3(3, 2, 6)
    camera.position.copy(initialCamRef.current)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  const normalizeScale = (targetRadius = 2) => {
    const root = modelRef.current
    if (!root) return
    const box = new THREE.Box3().setFromObject(root)
    const sphere = box.getBoundingSphere(new THREE.Sphere())
    const r = Math.max(sphere.radius, 1e-6)
    const factor = targetRadius / r
    root.scale.multiplyScalar(factor)
    fitView(root)
  }

  const placeGroundBelowModel = () => {
    const root = modelRef.current
    const ground = groundRef.current
    if (!root || !ground) return
    const box = new THREE.Box3().setFromObject(root)
    const size = new THREE.Vector3()
    box.getSize(size)
    const margin = Math.max(0.02, size.y * 0.02)
    ground.position.y = box.min.y - margin
  }

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.background = new THREE.Color(bgColor)
    scene.environment = useEnv ? envRef.current : null
    if (gridRef.current) gridRef.current.visible = showGrid
    if (groundRef.current) groundRef.current.visible = showGround
    if (axesRef.current) axesRef.current.visible = showAxes
    const root = modelRef.current
    if (root) {
      root.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          const mats = Array.isArray((o as THREE.Mesh).material) ? (o as THREE.Mesh).material : [(o as THREE.Mesh).material]
          mats.forEach(m => { (m as THREE.Material).wireframe = wireframe })
        }
      })
    }
  }, [bgColor, showGrid, showGround, showAxes, wireframe, useEnv])

  const onZipChange = async (file: File | null) => {
    if (!file) return
    setError(null)
    setLoading(true)
    setProgress(0)
    clearModel()
    try {
      const buf = await file.arrayBuffer()
      const data = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
        unzip(new Uint8Array(buf), (err, out) => err ? reject(err) : resolve(out))
      })
      const keys = Object.keys(data)
      const objKey = keys.find(k => k.toLowerCase().endsWith('.obj'))
      const mtlKey = keys.find(k => k.toLowerCase().endsWith('.mtl'))
      const texKeys = keys.filter(k => /\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(k))
      let objUrl = ''
      let mtlUrlLocal: string | undefined
      const toBlobUrl = (u8: Uint8Array, name: string) => {
        const ext = name.toLowerCase().split('.').pop() || ''
        const type = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'bmp' ? 'image/bmp' : 'application/octet-stream'
        const ab = (u8.buffer instanceof ArrayBuffer) ? u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) : new Uint8Array(u8).buffer
        const blob = new Blob([ab], { type })
        return URL.createObjectURL(blob)
      }
      if (objKey) {
        objUrl = toBlobUrl(data[objKey], objKey)
      }
      if (mtlKey) {
        mtlUrlLocal = toBlobUrl(data[mtlKey], mtlKey)
      }
      for (const tk of texKeys) {
        const url = toBlobUrl(data[tk], tk)
        registerAsset(tk, url)
      }
      if (objUrl) {
        await loadFromObj(objUrl, mtlUrlLocal)
      } else {
        setError('Zip 未找到 .obj')
        setLoading(false)
      }
    } catch (e) {
      setError(String(e))
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100dvh', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
      <div style={{ width: isMobile ? '100%' : 320, padding: 16, boxSizing: 'border-box', background: '#1b1b1b', color: '#eee', display: panelOpen ? 'block' : 'none' }}>
        <div style={{ fontSize: 18, marginBottom: 12 }}>模型加载</div>
        {/* <div style={{ marginBottom: 8 }}>模型 URL</div> */}
        {/* <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ flex: 1 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="支持 .glb/.gltf/.obj" />
          <button onClick={() => loadFromUrl(url)} disabled={loading}>加载</button>
        </div> */}
        {/* <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input style={{ flex: 1 }} value={mtlUrl} onChange={e => setMtlUrl(e.target.value)} placeholder="材质 URL(.mtl，可选)" />
        </div> */}
        <div style={{ margin: '12px 0 8px' }}>或选择本地文件</div>
        <input type="file" accept=".glb,.gltf,.obj,.mtl,.zip" multiple onChange={e => onFilesChange(e.target.files)} />
        <div style={{ marginTop: 8 }}>
          <input type="file" accept=".zip" onChange={e => onZipChange(e.target.files?.[0] || null)} />
        </div>
        <div style={{ marginTop: 12 }}>曝光</div>
        <input type="range" min={0.1} max={2} step={0.05} value={exposure} onChange={e => setExposure(parseFloat(e.target.value))} />
        <div style={{ marginTop: 12 }}>
          {loading ? <div>加载中 {progress}%</div> : null}
          {error ? <div style={{ color: '#f88' }}>错误: {error}</div> : null}
        </div>
        <div style={{ marginTop: 12, display: 'flex flex-wrap', gap: 8 }}>
          <button onClick={centerView}>居中视图</button>
          <button onClick={alignToOrigin}>对齐到原点</button>
          <button onClick={() => loadFromUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb')}>加载示例模型</button>
          <button onClick={resetCamera}>重置相机</button>
          <button onClick={() => normalizeScale(2)}>规范尺度</button>
          <button onClick={() => loadFromObj(localObj1Url)} disabled={loading}>加载内置OBJ1</button>
          <button onClick={() => loadFromObj(localObj2Url)} disabled={loading}>加载内置OBJ2</button>
          <button onClick={() => loadFromObj(localObj3Url)} disabled={loading}>加载内置OBJ3</button>
          <button onClick={() => loadFromUrl(localObj4Url)} disabled={loading}>加载内置glb</button>
        </div>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />网格</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={showGround} onChange={e => setShowGround(e.target.checked)} />地面</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={showAxes} onChange={e => setShowAxes(e.target.checked)} />坐标轴</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={wireframe} onChange={e => setWireframe(e.target.checked)} />线框</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={useEnv} onChange={e => setUseEnv(e.target.checked)} />环境光照</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>背景<input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} /></label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={autoCenter} onChange={e => setAutoCenter(e.target.checked)} />自动居中</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input type="checkbox" checked={autoNormalize} onChange={e => setAutoNormalize(e.target.checked)} />自动归一尺度</label>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>拖拽旋转，滚轮缩放</div>
      </div>
      <div ref={mountRef} style={{ flex: 1, position: 'relative' }}>
        <button
          onClick={() => setPanelOpen(p => !p)}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, padding: '8px 12px', borderRadius: 6, background: '#2b2b2b', color: '#eee', border: '1px solid #444' }}
        >{panelOpen ? '隐藏菜单' : '显示菜单'}</button>
      </div>
    </div>
  )
}

export default Rendering3D
