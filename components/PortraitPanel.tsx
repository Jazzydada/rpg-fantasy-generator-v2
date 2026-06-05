'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character } from '@/lib/types'

interface Props {
  character: Character | null
  imageUrl: string | null
  isLoadingImage: boolean
  imageStartedAt: number | null
  quality: 'fast' | 'high'
  onImageLoad: () => void
  onZoom: () => void
}

const LOADING_RUNES = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ']

function PortraitPanel({ character, imageUrl, isLoadingImage, imageStartedAt, quality, onImageLoad, onZoom }: Props) {
  // Remounted fresh for each imageUrl via key={imageUrl ?? 'empty'} in CharacterCard.
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError,  setImgError]  = useState(false)
  const [retryKey,  setRetryKey]  = useState(0)
  const retryCount = useRef(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isLoadingImage || !imageStartedAt) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - imageStartedAt) / 1000)))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [isLoadingImage, imageStartedAt])

  const handleLoad = useCallback(() => {
    setImgLoaded(true)
    onImageLoad()
  }, [onImageLoad])

  // Pollinations returns a non-image response while generating — retry up to 5×.
  const handleError = useCallback(() => {
    if (retryCount.current < 5) {
      retryCount.current += 1
      setTimeout(() => setRetryKey(k => k + 1), 3000)
    } else {
      setImgError(true)
      onImageLoad()
    }
  }, [onImageLoad])

  const showLoading = !!character && isLoadingImage && !imgError
  const estimate = quality === 'high' ? 60 : 40
  const remaining = Math.max(0, estimate - elapsed)
  const progress = Math.min(100, Math.round((elapsed / estimate) * 100))

  return (
    <div
      className="relative h-full w-full overflow-hidden group"
      style={{ background: '#0a0806', cursor: imgLoaded ? 'pointer' : 'default' }}
      onClick={imgLoaded ? onZoom : undefined}
    >
      {/* ── Hidden preloader ──────────────────────────────────────────────────
           crossOrigin="anonymous" ensures the browser caches the image with CORS
           headers from our /api/portrait proxy (which returns ACAO:*).
           This prevents html2canvas from getting a tainted canvas on export. */}
      {imageUrl && character && (
        <img
          key={retryKey}
          src={imageUrl}
          alt=""
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          aria-hidden
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
      )}

      {/* ── Full-bleed portrait ─────────────────────────────────────────────
           Uses CSS transition (not Framer Motion) so opacity completes even
           when requestAnimationFrame is throttled in sandboxed/background tabs.
           crossOrigin="anonymous" lets html2canvas export without tainted canvas. */}
      {character && imageUrl && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            opacity: imgLoaded ? 1 : 0,
            transition: imgLoaded ? 'opacity 0.9s ease-in' : 'none',
            willChange: 'opacity',
          }}
        >
          {/* START PORTRAIT FIX
               Replaces the blurred-duplicate background with a clean dark fantasy
               gradient. The blurred layer looked broken whenever the generated image
               didn't fill the full frame height (e.g. a full-body character in a
               portrait-ratio crop left large blurred bars at the sides/bottom).

               Solution:
               - Clean dark radial gradient background — looks intentional, matches UI
               - Single sharp img with object-contain + center center
               - Never stretches or distorts the image
               - Never crops head or feet
               - PNG export: only one image layer to composite → no blurred ghost */}

          {/* Dark fantasy background fill — replaces blurred duplicate */}
          <div
            aria-hidden
            data-export-hide="false"
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 38%, rgba(22,14,5,1) 0%, rgba(8,6,3,1) 65%, rgba(4,3,2,1) 100%)',
            }}
          />

          {/* START PORTRAIT FIX — object-fit:contain, never stretch
               Black bars are acceptable. Stretching is not.
               object-contain preserves aspect ratio exactly.
               object-position center center keeps the character centred.
               The dark gradient background fills any empty bars. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={character.name}
            crossOrigin="anonymous"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center center',
              display: 'block',
            }}
          />
          {/* END PORTRAIT FIX */}
          {/* END PORTRAIT FIX */}
        </div>
      )}

      {/* START PORTRAIT ON DEMAND SYSTEM — silhouette placeholder */}
      {character && !imageUrl && (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 38%, rgba(30,18,6,1) 0%, rgba(10,6,2,1) 60%, rgba(4,3,1,1) 100%)',
        }}>
          <svg
            viewBox="0 0 200 270"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            aria-hidden
          >
            {/* ── Outer decorative frame ────────────────────────────────── */}
            <rect x="10" y="10" width="180" height="250" fill="none" stroke="rgba(201,168,76,0.20)" strokeWidth="0.8"/>
            <rect x="14" y="14" width="172" height="242" fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth="0.5"/>
            {/* Corner ornaments */}
            <path d="M10 10 L10 22 M10 10 L22 10" stroke="rgba(201,168,76,0.50)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <path d="M190 10 L190 22 M190 10 L178 10" stroke="rgba(201,168,76,0.50)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <path d="M10 260 L10 248 M10 260 L22 260" stroke="rgba(201,168,76,0.50)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <path d="M190 260 L190 248 M190 260 L178 260" stroke="rgba(201,168,76,0.50)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

            {/* ── Arcane sigil circle ───────────────────────────────────── */}
            <circle cx="100" cy="148" r="80" fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth="0.7"/>
            <circle cx="100" cy="148" r="64" fill="none" stroke="rgba(201,168,76,0.09)" strokeWidth="0.5"/>
            {/* Eight-pointed star sigil */}
            <path d="M100 84 L103.5 102 L120 92 L110 108 L128 112 L110 116 L120 132 L103.5 122 L100 140 L96.5 122 L80 132 L90 116 L72 112 L90 108 L80 92 L96.5 102 Z"
              fill="rgba(201,168,76,0.06)" stroke="rgba(201,168,76,0.20)" strokeWidth="0.7" strokeLinejoin="round"/>
            {/* Inner circle */}
            <circle cx="100" cy="112" r="28" fill="none" stroke="rgba(201,168,76,0.10)" strokeWidth="0.6"/>
            {/* Rune tick marks on outer circle */}
            {[0,45,90,135,180,225,270,315].map((deg) => {
              const rad = (deg * Math.PI) / 180
              const x1 = 100 + 80 * Math.cos(rad - Math.PI/2)
              const y1 = 148 + 80 * Math.sin(rad - Math.PI/2)
              const x2 = 100 + 74 * Math.cos(rad - Math.PI/2)
              const y2 = 148 + 74 * Math.sin(rad - Math.PI/2)
              return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(201,168,76,0.22)" strokeWidth="0.8"/>
            })}

            {/* ── High-contrast silhouette ──────────────────────────────── */}
            {/* Head — strong clear profile */}
            <ellipse cx="100" cy="62" rx="24" ry="26" fill="rgba(4,2,1,0.98)"/>
            {/* Slightly pointed ear suggestion (fantasy) */}
            <path d="M76 52 C73 46 76 40 80 44" fill="rgba(4,2,1,0.98)"/>
            {/* Hair flowing back */}
            <path d="M76 46 C68 42 62 50 65 62 C68 70 74 72 78 68" fill="rgba(4,2,1,0.95)"/>
            {/* Neck */}
            <rect x="93" y="86" width="14" height="14" rx="2" fill="rgba(4,2,1,0.98)"/>
            {/* Broad cloaked shoulders */}
            <path d="M22 138 C24 114 52 100 100 98 C148 100 176 114 178 138 L174 230 L26 230 Z" fill="rgba(4,2,1,0.95)"/>
            {/* Pauldron highlights (shoulder armour plates) */}
            <ellipse cx="28" cy="130" rx="22" ry="14" fill="rgba(3,2,1,0.97)"/>
            <ellipse cx="172" cy="130" rx="22" ry="14" fill="rgba(3,2,1,0.97)"/>
            {/* Cloak edges — slightly lighter to create depth */}
            <path d="M22 138 L10 230 L26 230" fill="rgba(6,4,2,0.75)"/>
            <path d="M178 138 L190 230 L174 230" fill="rgba(6,4,2,0.75)"/>
            {/* Subtle collar/chest detail */}
            <path d="M86 100 Q100 110 114 100" fill="none" stroke="rgba(201,168,76,0.12)" strokeWidth="1.2"/>
            {/* Belt */}
            <rect x="72" y="178" width="56" height="6" rx="2" fill="rgba(6,4,2,0.90)"/>
            <rect x="97" y="176" width="6" height="10" rx="1" fill="rgba(20,14,6,0.85)"/>

            {/* ── Name label ───────────────────────────────────────────── */}
            <text x="100" y="253" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7.5" letterSpacing="2.5" fill="rgba(201,168,76,0.40)">{character.name.toUpperCase()}</text>
          </svg>
        </div>
      )}
      {/* END PORTRAIT ON DEMAND SYSTEM */}

      {/* Cinematic vignette — fades in with portrait */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: imgLoaded ? 1 : 0,
          transition: imgLoaded ? 'opacity 0.9s ease-in' : 'none',
          background: `
            radial-gradient(ellipse at 70% 40%, transparent 38%, rgba(0,0,0,0.12) 100%),
            linear-gradient(to left, transparent 46%, rgba(0,0,0,0.10) 100%)
          `,
        }}
      />

      {/* ── Loading animation ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5"
            style={{ background: 'rgba(5,3,2,0.82)', zIndex: 5 }}
          >
            <div className="relative w-28 h-28">
              {LOADING_RUNES.map((rune, i) => {
                const angle = (i / LOADING_RUNES.length) * 360
                const rad   = (angle * Math.PI) / 180
                const x = 50 + 40 * Math.cos(rad)
                const y = 50 + 40 * Math.sin(rad)
                return (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.15, 0.7, 0.15] }}
                    transition={{ duration: 2.2, delay: i * 0.16, repeat: Infinity }}
                    className="absolute font-cinzel"
                    style={{
                      left: `${x}%`, top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: '0.7rem',
                      color: 'rgba(201,168,76,0.6)',
                    }}
                  >
                    {rune}
                  </motion.span>
                )
              })}
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full"
                style={{ border: '1px solid rgba(201,168,76,0.18)' }} />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-6 rounded-full"
                style={{ border: '1px solid rgba(201,168,76,0.12)' }} />
            </div>
            <div className="text-center">
              <p className="font-cinzel tracking-widest"
                style={{ fontSize: '0.6rem', color: 'rgba(201,168,76,0.48)' }}>
                Maner portræt frem…
              </p>
              <p className="font-crimson italic mt-1"
                style={{ fontSize: '0.68rem', color: 'rgba(201,168,76,0.34)' }}>
                {elapsed < 10 ? 'Sender forespørgsel…' : elapsed < estimate ? `ca. ${remaining}s tilbage` : `Venter på plads i kø · ${elapsed}s`}
              </p>
              <div className="mt-3 h-px w-40 overflow-hidden" style={{ background: 'rgba(201,168,76,0.13)' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'rgba(201,168,76,0.48)', transition: 'width 0.35s ease' }} />
              </div>
              <p className="font-cinzel mt-2" style={{ fontSize: '0.48rem', letterSpacing: '0.13em', color: 'rgba(201,168,76,0.22)' }}>
                {quality === 'high' ? 'Perchance high quality → fallback' : 'Perchance → fallback'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ───────────────────────────────────────────────────── */}
      {imgError && character && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
          <div className="w-14 h-14 flex items-center justify-center"
            style={{ border: '1px solid rgba(201,168,76,0.18)', color: 'rgba(201,168,76,0.3)' }}>
            <span style={{ fontSize: '1.5rem' }}>⚔</span>
          </div>
          <p className="font-cinzel text-center"
            style={{ fontSize: '0.6rem', color: 'rgba(201,168,76,0.3)', letterSpacing: '0.1em' }}>
            Portræt utilgængeligt
          </p>
          <p className="font-crimson italic text-center leading-relaxed"
            style={{ fontSize: '0.65rem', color: 'rgba(201,168,76,0.18)', maxWidth: '180px' }}>
            Prøv "Nyt portræt" igen
          </p>
        </div>
      )}

      {/* ── Zoom hint ─────────────────────────────────────────────────────── */}
      {imgLoaded && (
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
          style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(201,168,76,0.25)', zIndex: 6 }}
        >
          <span className="font-cinzel" style={{ fontSize: '0.5rem', color: 'rgba(201,168,76,0.7)', letterSpacing: '0.12em' }}>
            ⊕ FORSTØR
          </span>
        </div>
      )}
    </div>
  )
}

export default memo(PortraitPanel)
