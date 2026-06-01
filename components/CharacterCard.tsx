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
  'radial-gradient(ellipse at 50% 50%, transparent 34%, rgba(0,0,0,0.17) 76%, rgba(0,0,0,0.44) 100%)',
].join(',')

// ─── Reusable overlay primitives (no per-render style-object churn) ─────────
const grainStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  backgroundImage: GLOBAL_GRAIN, backgroundSize: '512px 512px',
  mixBlendMode: 'overlay', opacity: 0.58,
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
  fontSize: 'clamp(0.58rem, 1.1vw, 0.70rem)',
  color: 'rgba(218,195,145,0.85)',
  letterSpacing: '0.04em',
  lineHeight: 1.4,
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



const cleanTextStyle: React.CSSProperties = {
  color: '#efe6cf',
  fontSize: 'clamp(0.86rem, 1.55vw, 1.02rem)',
  lineHeight: 1.42,
}

function SmallReroll({ onClick, title = 'Reroll' }: { onClick?: () => void; title?: string }) {
  if (!onClick) return null
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} title={title} style={{
      width: 22, height: 22, display: 'inline-grid', placeItems: 'center', borderRadius: '50%',
      border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(10,7,3,0.55)', color: '#d8b867', cursor: 'pointer', flexShrink: 0,
    }}>
      <RefreshCw size={12} strokeWidth={1.9} />
    </button>
  )
}

function InfoCard({ title, children, onReroll, accent = false }: { title: string; children: React.ReactNode; onReroll?: () => void; accent?: boolean }) {
  return (
    <section style={{
      position: 'relative',
      padding: accent ? '12px 13px' : '10px 12px',
      border: accent ? '1px solid rgba(63,38,12,0.65)' : '1px solid rgba(201,168,76,0.25)',
      background: accent
        ? 'linear-gradient(145deg, #d9bd84 0%, #b98745 100%)'
        : 'linear-gradient(145deg, rgba(31,20,10,0.88), rgba(12,8,4,0.88))',
      boxShadow: 'inset 0 0 18px rgba(0,0,0,0.38), 0 3px 12px rgba(0,0,0,0.24)',
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h3 className="font-cinzel" style={{
          margin: 0,
          color: accent ? '#2a1304' : '#d8b867',
          fontSize: accent ? '0.69rem' : '0.67rem',
          letterSpacing: '0.13em',
          fontWeight: 800,
          textTransform: 'uppercase',
        }}>{title}</h3>
        <span style={{ flex: 1, height: 1, background: accent ? 'rgba(48,20,5,0.28)' : 'rgba(201,168,76,0.18)' }} />
        <SmallReroll onClick={onReroll} />
      </div>
      <div className="font-crimson" style={accent ? { color: '#211006', fontSize: 'clamp(0.78rem,1.34vw,0.92rem)', lineHeight: 1.34, fontWeight: 600 } : cleanTextStyle}>
        {children}
      </div>
    </section>
  )
}

function DesktopRedesign({ character, imageUrl, isGenerating, isLoadingImage, imageStartedAt, quality, onImageLoad, onZoom, onRerollName, onRerollField, lang }: Props & { lang: Lang }) {
  const portraitProps = { character, imageUrl, isLoadingImage, imageStartedAt, quality, onImageLoad, onZoom }

  if (isGenerating || !character) {
    return (
      <div className="hidden md:grid" style={{ aspectRatio: '4 / 5', placeItems: 'center', background: '#0a0806', boxShadow: SHADOW, border: '1px solid rgba(201,168,76,0.24)' }}>
        <div className="font-cinzel text-xs tracking-widest animate-pulse" style={{ color: 'rgba(201,168,76,0.48)' }}>{isGenerating ? t(lang, 'consulting') : t(lang, 'generatePrompt')}</div>
      </div>
    )
  }

  const c = character.combatStats
  const abilities = character.abilityScores
  const abilityRows: Array<[string, keyof typeof abilities]> = [['STR','strength'],['DEX','dexterity'],['CON','constitution'],['INT','intelligence'],['WIS','wisdom'],['CHA','charisma']]

  return (
    <div className="hidden md:grid" style={{
      position: 'relative',
      aspectRatio: '4 / 5',
      gridTemplateRows: 'auto 1fr auto',
      gap: 10,
      padding: 18,
      overflow: 'hidden',
      background: [
        'radial-gradient(ellipse at 20% 0%, rgba(87,45,11,0.35), transparent 46%)',
        'linear-gradient(145deg, #22170b 0%, #120c06 52%, #080604 100%)',
      ].join(','),
      boxShadow: SHADOW,
      border: '1px solid rgba(201,168,76,0.27)',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: GLOBAL_GRAIN, opacity: 0.19, pointerEvents: 'none' }} />

      <header style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start', borderBottom: '1px solid rgba(201,168,76,0.22)', paddingBottom: 10 }}>
        <div>
          <h1 className="font-cinzel-decorative uppercase" style={{ margin: 0, color: '#f0dfb4', fontSize: 'clamp(1.55rem, 3.7vw, 2.25rem)', lineHeight: 0.96, letterSpacing: '0.035em', textShadow: '0 2px 16px rgba(0,0,0,0.85)' }}>{character.name}</h1>
          <p className="font-cinzel" style={{ margin: '7px 0 0', color: '#caa85a', fontSize: 'clamp(0.72rem,1.25vw,0.86rem)', letterSpacing: '0.11em' }}>{tr(character, lang, 'species')} · {tr(character, lang, 'characterClass')} · {t(lang, 'level')} {character.level}</p>
        </div>
        <SmallReroll onClick={onRerollName} title="Rul navn om" />
      </header>

      <main style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '31% 1fr', gap: 12, minHeight: 0 }}>
        <aside style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 10, minHeight: 0 }}>
          <div style={{ border: '1px solid rgba(201,168,76,0.28)', background: '#050403', padding: 7, boxShadow: 'inset 0 0 25px rgba(0,0,0,0.65)' }}>
            <div style={{ position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden', background: '#080604' }}>
              <PortraitPanel key={imageUrl ?? 'empty'} {...portraitProps} />
            </div>
          </div>
          <InfoCard title={t(lang, 'appearance')} onReroll={() => onRerollField('appearance')}>
            <span style={{ fontSize: 'clamp(0.78rem,1.25vw,0.9rem)', lineHeight: 1.35 }}>{trAppearance(character, lang)}</span>
          </InfoCard>
          <InfoCard title={t(lang, 'combatData')} accent>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 7 }}>
              <strong>AC {c.armorClass}</strong><strong>HP {c.hitPoints}</strong><strong>Init {c.initiative}</strong>
              <span>Speed {c.speed}</span><span>PP {c.passivePerception}</span><span>CR {c.challenge}</span>
            </div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.28 }}><b>Melee:</b> {c.melee.name} {c.melee.toHit} · {c.melee.damage}</div>
            <div style={{ fontSize: '0.78rem', lineHeight: 1.28 }}><b>Range:</b> {c.ranged.name} {c.ranged.toHit} · {c.ranged.damage}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 3, marginTop: 8 }}>
              {abilityRows.map(([abbr, key]) => <div key={abbr} style={{ textAlign: 'center', border: '1px solid rgba(44,20,5,0.30)', padding: '2px 1px' }}><div style={{ fontSize: '0.48rem', letterSpacing: '0.05em' }}>{abbr}</div><b>{abilities[key]}</b></div>)}
            </div>
          </InfoCard>
        </aside>

        <section style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 10, minHeight: 0 }}>
          <InfoCard title={t(lang, 'firstImpression')}>
            <em>{tr(character, lang, 'firstImpression')}</em>
          </InfoCard>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
            <InfoCard title={t(lang, 'race')}><b>{tr(character, lang, 'species')}</b></InfoCard>
            <InfoCard title={t(lang, 'class')}><b>{tr(character, lang, 'characterClass')}</b></InfoCard>
            <InfoCard title={t(lang, 'alignment')}><b>{tr(character, lang, 'alignment')}</b></InfoCard>
            <InfoCard title={t(lang, 'level')}><b>{character.level}</b></InfoCard>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <InfoCard title={t(lang, 'personalityTrait')} onReroll={() => onRerollField('personalityTrait')}>{tr(character, lang, 'personalityTrait')}</InfoCard>
              <InfoCard title={t(lang, 'ideal')} onReroll={() => onRerollField('ideal')}>{tr(character, lang, 'ideal')}</InfoCard>
              <InfoCard title={t(lang, 'bond')} onReroll={() => onRerollField('bond')}>{tr(character, lang, 'bond')}</InfoCard>
              <InfoCard title={t(lang, 'flaw')} onReroll={() => onRerollField('flaw')}>{tr(character, lang, 'flaw')}</InfoCard>
            </div>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <InfoCard title={t(lang, 'motivation')} onReroll={() => onRerollField('motivation')}>{tr(character, lang, 'motivation')}</InfoCard>
              <InfoCard title={t(lang, 'secret')} onReroll={() => onRerollField('secret')}>{tr(character, lang, 'secret')}</InfoCard>
              <InfoCard title={t(lang, 'mannerism')} onReroll={() => onRerollField('mannerism')}>{tr(character, lang, 'mannerism')}</InfoCard>
              <InfoCard title={t(lang, 'relation')} onReroll={() => onRerollField('relationship')}>{tr(character, lang, 'relationship')}</InfoCard>
            </div>
          </div>
          <InfoCard title={t(lang, 'sceneHook')} onReroll={() => onRerollField('sceneHook')}>
            <strong style={{ color: '#f3dfae' }}>{tr(character, lang, 'sceneHook')}</strong>
          </InfoCard>
        </section>
      </main>

      <footer className="font-cinzel" style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(201,168,76,0.18)', paddingTop: 8, color: 'rgba(201,168,76,0.48)', letterSpacing: '0.16em', fontSize: '0.56rem', textAlign: 'center' }}>
        ASAHEIMS RPG FANTASY GENERATOR
      </footer>
    </div>
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
      style={{ position: 'relative', maxWidth: 960 }}
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

      <DesktopRedesign character={character} imageUrl={imageUrl} isGenerating={isGenerating} isLoadingImage={isLoadingImage} imageStartedAt={imageStartedAt} quality={quality} onImageLoad={onImageLoad} onZoom={onZoom} onRerollName={onRerollName} onRerollField={onRerollField} lang={lang} />

    </motion.div>
  )
})

export default memo(CharacterCard)
