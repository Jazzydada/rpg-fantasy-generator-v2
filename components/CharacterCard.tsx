'use client'

import { forwardRef, memo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import CharacterSheet from './CharacterSheet'
import PortraitPanel from './PortraitPanel'
import type { Character } from '@/lib/types'
import type { RerollField } from '@/lib/generator'
import { t, type Lang } from '@/lib/i18n'
import { translateAppearanceToEn } from '@/lib/generator'

// Translation helper (mirrors CharacterSheet's tr)
function tr(char: Character, lang: Lang, field: keyof NonNullable<Character['translations']>['da']): string {
  return char.translations?.[lang]?.[field] ?? (char[field as keyof Character] as string) ?? ''
}

// START INSTANT LANGUAGE SWITCH — appearance
// Always translate via the live APPEARANCE_EN lookup for EN.
// The stored translations.en.appearance may equal the Danish string
// if the key wasn't in the lookup table at generation time, so we
// re-run the lookup every render — it's just a dictionary lookup, very cheap.
function trAppearance(char: Character, lang: Lang): string {
  const da = char.translations?.da?.appearance ?? char.appearance ?? ''
  if (lang === 'da') return da
  const en = translateAppearanceToEn(da)
  // If the lookup found a translation, use it; otherwise fall back to DA
  return en
}
// END INSTANT LANGUAGE SWITCH

// ─── SVG/CSS constants ───────────────────────────────────────────────────────
const GLOBAL_GRAIN = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.07'/%3E%3C/svg%3E")`

const RAGGED_EDGE = `url("data:image/svg+xml,%3Csvg preserveAspectRatio='none' viewBox='0 0 54 1000' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.055 0.32' numOctaves='4' seed='8'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='12'/%3E%3C/filter%3E%3Cpath filter='url(%23n)' fill='%230c0904' d='M0 0 C20 18 13 38 28 61 C40 82 11 97 30 124 C45 145 17 166 31 191 C47 219 15 238 27 269 C39 299 12 326 30 358 C43 384 18 416 29 449 C42 486 13 510 31 548 C45 584 17 612 29 645 C40 681 10 707 30 742 C45 772 17 802 31 836 C45 873 12 904 29 938 C39 963 21 982 38 1000 L0 1000 Z'/%3E%3C/svg%3E")`

const SHADOW = [
  '0 0 0 1px rgba(201,168,76,0.28)',
  '0 18px 70px rgba(0,0,0,0.95)',
  '0 0 110px rgba(0,0,0,0.72)',
].join(',')

const VIGNETTE = [
  'radial-gradient(ellipse at 10% 5%, rgba(96,52,12,0.08) 0%, transparent 38%)',
  'radial-gradient(ellipse at 92% 94%, rgba(0,0,0,0.12) 0%, transparent 36%)',
  'radial-gradient(ellipse at 50% 50%, transparent 42%, rgba(0,0,0,0.10) 78%, rgba(0,0,0,0.30) 100%)',
].join(',')

// ─── Reusable overlay primitives (no per-render style-object churn) ─────────
const grainStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  backgroundImage: GLOBAL_GRAIN, backgroundSize: '512px 512px',
  mixBlendMode: 'overlay', opacity: 0.30,
}
const vignetteStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none', background: VIGNETTE,
}
const borderStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  border: '1px solid rgba(201,168,76,0.24)',
  boxShadow: 'inset 0 0 80px rgba(0,0,0,0.22)',
}

function GrainOverlay({ zIndex }: { zIndex: number }) {
  return <div data-export-hide="true" style={{ ...grainStyle, zIndex }} />
}
function VignetteOverlay({ zIndex }: { zIndex: number }) {
  return <div data-export-hide="true" style={{ ...vignetteStyle, zIndex }} />
}
function CardBorder({ zIndex }: { zIndex: number }) {
  return <div style={{ ...borderStyle, zIndex }} />
}

const appearanceLabelStyle: React.CSSProperties = { color: 'rgba(201,168,76,0.45)' }
const appearanceTextStyle: React.CSSProperties = {
  fontSize: 'clamp(0.68rem, 1.05vw, 0.80rem)',
  color: 'rgba(239,224,189,0.94)',
  letterSpacing: '0.02em',
  lineHeight: 1.45,
}
function AppearanceReroll({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} title="Rul udseende om" style={{ marginLeft: 6, width: 18, height: 18, display: 'inline-grid', placeItems: 'center', border: '1px solid rgba(201,168,76,0.28)', borderRadius: '50%', background: 'rgba(13,11,7,0.50)', color: 'rgba(214,183,112,0.82)', verticalAlign: 'middle' }}>
      <RefreshCw size={10} strokeWidth={1.8} />
    </button>
  )
}
function AppearanceLine({ text, onReroll, lang = 'da' }: { text: string; onReroll?: () => void; lang?: Lang }) {
  return (
    <p className="font-cinzel text-center leading-snug" style={appearanceTextStyle}>
      <span style={appearanceLabelStyle}>{t(lang, 'appearance')}: </span>
      {text}
      <AppearanceReroll onClick={onReroll} />
    </p>
  )
}

interface Props {
  character: Character | null
  imageUrl: string | null
  isGenerating: boolean
  isLoadingImage: boolean
  imageStartedAt: number | null
  quality: 'fast' | 'high'
  onImageLoad: () => void
  onZoom: () => void
  onRerollName: () => void
  onRerollField: (field: RerollField) => void
  lang?: Lang
}

// NOTE: Both layouts are rendered; CSS hides the inactive one at the breakpoint.
// Yes, this means PortraitPanel mounts twice and both fire the img preloader,
// but modern browsers coalesce in-flight requests for the same URL, and our
// proxy sets `Cache-Control: immutable` so the second hit is cache-only.
// The benefit is zero hydration mismatch and no flash-of-wrong-layout on
// first paint — a worthwhile trade for a character generator.
const CharacterCard = forwardRef<HTMLDivElement, Props>(function CharacterCard(
  { character, imageUrl, isGenerating, isLoadingImage, imageStartedAt, quality, onImageLoad, onZoom, onRerollName, onRerollField, lang = 'da' },
  ref,
) {
  const portraitProps = {
    character, imageUrl, isLoadingImage, imageStartedAt, quality, onImageLoad, onZoom,
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="w-full"
      style={{ position: 'relative', maxWidth: 920 }}
    >

      {/* ── MOBILE layout (< md) ─────────────────────────────────────────── */}
      <div
        className="md:hidden"
        style={{ position: 'relative', background: '#0a0806', boxShadow: SHADOW, overflow: 'hidden' }}
      >
        {/* Mobile name header — CHARACTER NAME + Race · Class above portrait */}
        {character && !isGenerating && (
          <div style={{
            padding: '18px 20px 14px',
            textAlign: 'center',
            background: 'rgba(8,5,2,0.98)',
            borderBottom: '1px solid rgba(201,168,76,0.18)',
            position: 'relative',
          }}>
            {/* Reroll button top-right */}
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <button
                onClick={onRerollName}
                title="Rul navn om"
                style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', border: '1px solid rgba(201,168,76,0.28)', borderRadius: '50%', background: 'rgba(13,11,7,0.60)', color: 'rgba(214,183,112,0.82)', cursor: 'pointer' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
              </button>
            </div>
            {/* Name */}
            <h2 className="font-cinzel-decorative uppercase" style={{
              color: '#efe0bd',
              fontWeight: 900,
              fontSize: 'clamp(1.05rem, 5.5vw, 1.45rem)',
              letterSpacing: '0.045em',
              lineHeight: 1,
              wordBreak: 'break-word',
              margin: 0,
              textShadow: '0 1px 9px rgba(0,0,0,0.96)',
              paddingRight: 28,
            }}>
              {character.name}
            </h2>
            {/* Race · Class */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 8 }}>
              <span style={{ height: 1, width: 28, background: 'rgba(201,168,76,0.40)', flexShrink: 0 }} />
              <p className="font-cinzel" style={{
                color: 'rgba(211,181,113,0.62)',
                fontSize: 'clamp(0.52rem, 2.5vw, 0.65rem)',
                letterSpacing: '0.12em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}>
                {tr(character, lang, 'species')} · {tr(character, lang, 'characterClass')}
              </p>
              <span style={{ height: 1, width: 28, background: 'rgba(201,168,76,0.40)', flexShrink: 0 }} />
            </div>
          </div>
        )}

        {/* Mobile portrait — shorter ratio so text is reachable without scrolling */}
        <div style={{ position: 'relative', aspectRatio: '4 / 3', maxHeight: 420, overflow: 'hidden' }}>
          <PortraitPanel key={imageUrl ?? 'empty'} {...portraitProps} />
          <GrainOverlay zIndex={22} />
          <VignetteOverlay zIndex={23} />
        </div>

        {character && !isGenerating && (
          <div style={{
            padding: '9px 20px 10px',
            background: 'rgba(8,5,2,0.95)',
            borderTop: '1px solid rgba(201,168,76,0.18)',
            borderBottom: '1px solid rgba(201,168,76,0.18)',
          }}>
            <AppearanceLine text={trAppearance(character, lang)} lang={lang} />
          </div>
        )}

        <CharacterSheet character={character} isGenerating={isGenerating} layout="stacked" onRerollName={onRerollName} onRerollField={onRerollField} lang={lang} />

        <CardBorder zIndex={30} />
      </div>

      {/* ── DESKTOP layout (≥ md) ────────────────────────────────────────── */}
      {/* 60% text sheet / 40% portrait — wider text panel for readability */}
      <div
        className="hidden md:flex"
        style={{
          position: 'relative',
          aspectRatio: '4 / 5',
          overflow: 'hidden',
          background: '#0a0806',
          boxShadow: SHADOW,
        }}
      >
        {/* Left text sheet — 62% width */}
        <div style={{
          width: '62%',
          flexShrink: 0,
          height: '100%',
          zIndex: 10,
          position: 'relative',
          boxShadow: '4px 0 18px rgba(0,0,0,0.6)',
        }}>
          <CharacterSheet character={character} isGenerating={isGenerating} onRerollName={onRerollName} onRerollField={onRerollField} lang={lang} />
        </div>

        {/* Thin divider line */}
        <div aria-hidden style={{
          position: 'absolute', top: 0, bottom: 0, left: '62%',
          width: 1, background: 'rgba(201,168,76,0.14)', zIndex: 12, pointerEvents: 'none',
        }} />

        {/* Right portrait panel — 38% width, framed with padding */}
        <div style={{
          flex: 1,
          height: '100%',
          position: 'relative',
          background: 'radial-gradient(ellipse at 50% 35%, rgba(18,10,3,1) 0%, rgba(6,4,2,1) 100%)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Portrait with inner padding — not full-bleed */}
          <div style={{ flex: 1, padding: '20px 18px 6px', position: 'relative', minHeight: 0 }}>
            <div style={{
              position: 'relative',
              height: '100%',
              border: '1px solid rgba(201,168,76,0.26)',
              overflow: 'hidden',
            }}>
              <PortraitPanel key={imageUrl ?? 'empty'} {...portraitProps} />
            </div>
          </div>

          {/* Appearance caption below portrait */}
          {character && !isGenerating && (
            <div style={{ padding: '8px 18px 14px', flexShrink: 0 }}>
              <AppearanceLine text={trAppearance(character, lang)} lang={lang} />
            </div>
          )}
        </div>

        <CardBorder zIndex={20} />
        <GrainOverlay zIndex={22} />
        <VignetteOverlay zIndex={23} />
      </div>

    </motion.div>
  )
})

export default memo(CharacterCard)
