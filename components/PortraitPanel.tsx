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
  const estimate = quality === 'high' ? 28 : 20
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
      {/* Shown when no portrait exists yet, AND while loading (behind loading overlay) */}
      {character && !imageUrl && (
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 32%, rgba(18,10,3,1) 0%, rgba(5,3,2,1) 100%)' }}>
          {/* Sigil rings */}
          <svg viewBox="0 0 200 260" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }} aria-hidden>
            {/* Outer decorative rings */}
            <circle cx="100" cy="145" r="88" fill="none" stroke="rgba(201,168,76,0.08)" strokeWidth="0.7"/>
            <circle cx="100" cy="145" r="72" fill="none" stroke="rgba(201,168,76,0.06)" strokeWidth="0.5"/>
            {/* Eight-pointed arcane sigil */}
            <path d="M100 57 L104 82 L126 66 L111 86 L136 90 L111 94 L126 114 L104 98 L100 123 L96 98 L74 114 L89 94 L64 90 L89 86 L74 66 L96 82 Z"
              fill="rgba(201,168,76,0.04)" stroke="rgba(201,168,76,0.12)" strokeWidth="0.6"/>
            {/* Inner ring with rune marks */}
            <circle cx="100" cy="90" r="50" fill="none" stroke="rgba(201,168,76,0.05)" strokeWidth="0.5"/>
            {/* Silhouette — head */}
            <ellipse cx="100" cy="68" rx="22" ry="23" fill="rgba(8,6,3,0.90)"/>
            {/* Hood/hair hint */}
            <path d="M78 58 C75 44 82 34 100 32 C118 34 125 44 122 58 C118 49 112 44 100 43 C88 44 82 49 78 58Z" fill="rgba(12,8,4,0.80)"/>
            {/* Neck */}
            <rect x="93" y="89" width="14" height="11" rx="2" fill="rgba(8,6,3,0.90)"/>
            {/* Shoulders broad cloak */}
            <path d="M26 128 C28 108 54 97 100 96 C146 97 172 108 174 128 L168 220 L32 220 Z" fill="rgba(8,6,3,0.82)"/>
            {/* Pauldrons */}
            <ellipse cx="34" cy="122" rx="20" ry="11" fill="rgba(6,4,2,0.88)"/>
            <ellipse cx="166" cy="122" rx="20" ry="11" fill="rgba(6,4,2,0.88)"/>
            {/* Cloak folds */}
            <path d="M26 128 L14 220 L32 220" fill="rgba(6,4,2,0.65)"/>
            <path d="M174 128 L186 220 L168 220" fill="rgba(6,4,2,0.65)"/>
            {/* Belt/equipment hint */}
            <rect x="68" y="168" width="64" height="5" rx="2" fill="rgba(12,8,4,0.60)"/>
            {/* Subtle chest detail */}
            <path d="M85 100 Q100 108 115 100" fill="none" stroke="rgba(201,168,76,0.06)" strokeWidth="0.8"/>
            {/* Corner ornaments */}
            <path d="M10 10 L10 26 M10 10 L26 10" stroke="rgba(201,168,76,0.28)" strokeWidth="0.8" fill="none"/>
            <path d="M190 10 L190 26 M190 10 L174 10" stroke="rgba(201,168,76,0.28)" strokeWidth="0.8" fill="none"/>
            <path d="M10 250 L10 234 M10 250 L26 250" stroke="rgba(201,168,76,0.28)" strokeWidth="0.8" fill="none"/>
            <path d="M190 250 L190 234 M190 250 L174 250" stroke="rgba(201,168,76,0.28)" strokeWidth="0.8" fill="none"/>
            {/* Name at bottom */}
            <text x="100" y="242" textAnchor="middle" fontFamily="serif" fontSize="7" letterSpacing="2" fill="rgba(201,168,76,0.25)">{character.name.toUpperCase()}</text>
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
                {elapsed < estimate ? `ca. ${remaining}s tilbage` : `stadig i gang · ${elapsed}s`}
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
