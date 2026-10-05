import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const LIVE_VIDEO_ID = 'CDLrTcWFI4k'

function getAustinClock() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date())

  const hour24 = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date()),
  )

  const label = parts.map((p) => p.value).join('')
  const phase =
    hour24 < 6 ? 'night' :
    hour24 < 11 ? 'morning' :
    hour24 < 17 ? 'day' :
    hour24 < 20 ? 'sunset' : 'night'

  return { label, phase }
}

function useAustinClock() {
  const [clock, setClock] = useState(getAustinClock)

  useEffect(() => {
    const id = window.setInterval(() => setClock(getAustinClock()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return clock
}

function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setProgress(Math.max(0, Math.min(1, window.scrollY / max)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return progress
}

function RevenueCore({ progress }) {
  const group = useRef()
  const outer = useRef()
  const middle = useRef()
  const { pointer } = useThree()

  useFrame(({ clock }, delta) => {
    if (!group.current) return

    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.x * 0.22 + progress * 0.65,
      0.035,
    )
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      pointer.y * 0.1,
      0.035,
    )

    if (outer.current) outer.current.rotation.z += delta * 0.18
    if (middle.current) middle.current.rotation.x = clock.elapsedTime * -0.18
  })

  const intensity = 1 + progress * 1.3

  return (
    <group ref={group}>
      <Float speed={0.7} rotationIntensity={0.08} floatIntensity={0.2}>
        <mesh>
          <icosahedronGeometry args={[1.05, 7]} />
          <MeshTransmissionMaterial
            transmission={1}
            thickness={0.45}
            roughness={0.17}
            chromaticAberration={0.018}
            anisotropy={0.08}
            distortion={0.05}
            distortionScale={0.15}
            temporalDistortion={0.04}
            color="#d7f5ff"
            attenuationColor="#1c3344"
            attenuationDistance={1.2}
            ior={1.18}
          />
        </mesh>

        <mesh scale={0.62}>
          <icosahedronGeometry args={[1, 5]} />
          <meshPhysicalMaterial
            color="#07131c"
            metalness={0.7}
            roughness={0.22}
            clearcoat={0.8}
            clearcoatRoughness={0.22}
            emissive="#0a5f72"
            emissiveIntensity={0.42 * intensity}
          />
        </mesh>

        <mesh ref={outer} rotation={[Math.PI / 2.4, 0.25, 0]}>
          <torusGeometry args={[1.46, 0.012, 10, 180]} />
          <meshBasicMaterial color="#a8e8ff" transparent opacity={0.55} />
        </mesh>

        <mesh ref={middle} rotation={[0.35, 0.2, Math.PI / 2]}>
          <torusGeometry args={[1.72, 0.008, 10, 180]} />
          <meshBasicMaterial color="#efc17f" transparent opacity={0.34} />
        </mesh>

        <pointLight color="#6ad9ff" intensity={3.2 * intensity} distance={6} />
      </Float>
    </group>
  )
}

function FlowLines({ progress }) {
  const lines = useMemo(() => {
    return [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.2, 1.3, -0.4),
        new THREE.Vector3(-2.2, 1.15, 0.15),
        new THREE.Vector3(-0.8, 0.25, 0.2),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.0, -0.1, 0.4),
        new THREE.Vector3(-2.3, 0.35, -0.2),
        new THREE.Vector3(-0.8, 0.1, 0.05),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.8, 0.2, 0),
        new THREE.Vector3(2.2, 0.75, -0.25),
        new THREE.Vector3(4.3, 1.05, 0.18),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.75, -0.05, 0.2),
        new THREE.Vector3(2.35, -0.2, 0.15),
        new THREE.Vector3(4.15, 0.05, -0.15),
      ]),
    ]
  }, [])

  return (
    <group>
      {lines.map((curve, index) => {
        const geometry = new THREE.TubeGeometry(curve, 80, 0.012, 8, false)
        return (
          <mesh key={index} geometry={geometry}>
            <meshBasicMaterial
              color={index < 2 ? '#80dfff' : '#f1bd77'}
              transparent
              opacity={0.14 + progress * 0.16}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function Scene({ progress }) {
  const { camera } = useThree()

  useFrame(() => {
    const targetZ = 7.2 - progress * 0.55
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.025)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, (progress - 0.5) * 0.7, 0.02)
    camera.lookAt(0, 0.15, 0)
  })

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 4]} intensity={0.45} color="#dff4ff" />
      <RevenueCore progress={progress} />
      <FlowLines progress={progress} />
      <Sparkles
        count={70}
        scale={[10, 4, 4]}
        size={0.8}
        speed={0.12}
        color="#c8f4ff"
        opacity={0.22}
      />
    </>
  )
}

const stages = [
  {
    number: '01',
    eyebrow: 'REAL AUSTIN / REAL TIME',
    title: 'Your next customer is already calling.',
    body: 'The background is a real downtown Austin live stream. The 3D layer stays intentionally restrained so the city remains the hero, while the interface feels optically embedded into the scene instead of pasted on top.',
    bullets: ['Live Austin skyline', 'Time-aware grade', 'Native glass materials'],
  },
  {
    number: '02',
    eyebrow: 'REVENUE LEAK',
    title: 'Make the problem spatial, not decorative.',
    body: 'Instead of filling the screen with floating cards, incoming calls and leads converge toward one revenue core. Missed opportunities can break away, dim, or disappear as the visitor scrolls.',
    bullets: ['Fewer UI boxes', 'Real depth hierarchy', 'Problem visualized in motion'],
  },
  {
    number: '03',
    eyebrow: 'AI RECOVERY ENGINE',
    title: 'The system reacts like a product.',
    body: 'The glass core refracts the live city behind it, responds to pointer movement, and routes visual lead paths through capture, response, qualification and booking. That optical continuity is what removes the “AI poster” feel.',
    bullets: ['Transmission, not opacity', 'Refraction + environment continuity', 'Scroll-driven routing'],
  },
  {
    number: '04',
    eyebrow: 'CONVERSION',
    title: 'Then let the visitor see their own business in it.',
    body: 'The final live version can switch industry, problem and desired outcome without changing the entire visual language. The sales action becomes “show me my system,” not a generic contact form.',
    bullets: ['Industry modes', 'Personalized demo', 'Booking handoff'],
  },
]

function App() {
  const progress = useScrollProgress()
  const { label: austinTime, phase } = useAustinClock()
  const currentStage = Math.min(stages.length - 1, Math.floor(progress * stages.length))

  return (
    <main className={`app phase-${phase}`}>
      <div className="live-background" aria-hidden="true">
        <iframe
          title="Live downtown Austin skyline"
          src={`https://www.youtube.com/embed/${LIVE_VIDEO_ID}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1&loop=1&playlist=${LIVE_VIDEO_ID}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <div className="video-grade" />
        <div className="video-depth" />
      </div>

      <div className="webgl-layer" aria-hidden="true">
        <Canvas
          dpr={[1, 1.35]}
          camera={{ position: [0, 0.4, 7.2], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Suspense fallback={null}>
            <Scene progress={progress} />
          </Suspense>
        </Canvas>
      </div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>AUSTIN AI</strong>
            <small>MARKETING CO.</small>
          </div>
        </div>

        <div className="live-pill">
          <span className="live-dot" />
          LIVE AUSTIN · {austinTime}
        </div>

        <button
          className="top-cta"
          onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Build my demo
        </button>
      </header>

      <div className="progress-rail">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <aside className="stage-rail">
        {stages.map((stage, index) => (
          <button
            key={stage.number}
            className={index === currentStage ? 'active' : ''}
            onClick={() =>
              document
                .getElementById(`stage-${index}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          >
            <span>{stage.number}</span>
            <em>{stage.eyebrow}</em>
          </button>
        ))}
      </aside>

      <div className="story">
        {stages.map((stage, index) => (
          <section
            id={`stage-${index}`}
            className={`story-stage ${index % 2 ? 'right' : 'left'}`}
            key={stage.number}
          >
            <div className="glass-panel">
              <div className="eyebrow">{stage.eyebrow}</div>
              <h1>{stage.title}</h1>
              <p>{stage.body}</p>
              <div className="chips">
                {stage.bullets.map((bullet) => (
                  <span key={bullet}>{bullet}</span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      <section id="demo" className="demo-section">
        <div className="demo-panel">
          <div className="demo-copy">
            <div className="eyebrow">NATIVE 3D CORRECTION / SAMPLE</div>
            <h2>Same Austin. Same light. One visual system.</h2>
            <p>
              The live skyline supplies the real atmosphere. The 3D scene uses transparent physical materials,
              restrained motion and optical depth so the product layer feels built into Austin rather than composited
              over it.
            </p>
          </div>

          <div className="demo-grid">
            {[
              ['Restaurant & Catering', 'Calls → reservations'],
              ['Med Spa', 'Leads → appointments'],
              ['Home Services', 'Calls → jobs'],
              ['Professional Services', 'Inquiries → qualified meetings'],
            ].map(([name, outcome]) => (
              <button key={name}>
                <strong>{name}</strong>
                <span>{outcome}</span>
                <b>↗</b>
              </button>
            ))}
          </div>

          <div className="demo-actions">
            <button className="primary">Show me my system →</button>
            <a
              href="https://www.youtube.com/watch?v=CDLrTcWFI4k"
              target="_blank"
              rel="noreferrer"
            >
              Live footage source ↗
            </a>
          </div>

          <small className="source-note">
            Prototype uses an embedded third-party Austin live stream. Commercial production should use licensed
            footage or a camera feed you control.
          </small>
        </div>
      </section>
    </main>
  )
}

export default App
