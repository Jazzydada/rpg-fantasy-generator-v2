'use client'

import { forwardRef, memo } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import CharacterSheet from './CharacterSheet'
import PortraitPanel from './PortraitPanel'
import type { Character } from '@/lib/types'
import type { RerollField } from '@/lib/generator'
import { t, type Lang } from '@/lib/i18n'
import { translateAppearanceToEn, translateWeaponToEn } from '@/lib/generator'

// Translation helper (mirrors CharacterSheet's tr)
function tr(char: Character, lang: Lang, field: keyof NonNullable<Character['translations']>['da']): string {
  const raw = char.translations?.[lang]?.[field] ?? (char[field as keyof Character] as string) ?? ''
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

// START INSTANT LANGUAGE SWITCH — appearance
// Always translate via the live APPEARANCE_EN lookup for EN.
// The stored translations.en.appearance may equal the Danish string
// if the key wasn't in the lookup table at generation time, so we
// re-run the lookup every render — it's just a dictionary lookup, very cheap.
function trAppearance(char: Character, lang: Lang): string {
  const da = char.translations?.da?.appearance ?? char.appearance ?? ''
  const raw = lang === 'da' ? da : translateAppearanceToEn(da)
  return raw.charAt(0).toUpperCase() + raw.slice(1)
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

// ─── Colour palette ──────────────────────────────────────────────────────────
// Each GM-facing category has its own identity. Colours are restrained and
// readable — saturated enough to distinguish at a glance, dark enough to fit
// the fantasy aesthetic.
const T = (bg: string, border: string, title: string, divider: string, text: React.CSSProperties) =>
  ({ bg, border, title, divider, text })

const CARD_THEMES = {
  // UI / structural
  accent:      T('linear-gradient(145deg,#d9bd84,#b98745)',                             'rgba(63,38,12,0.65)',   '#2a1304', 'rgba(48,20,5,0.28)',    { color: '#211006', fontSize: 'clamp(0.78rem,1.34vw,0.92rem)', lineHeight: 1.34, fontWeight: 600 } as React.CSSProperties),
  stat:        T('linear-gradient(145deg,rgba(34,12,56,0.70),rgba(12,4,20,0.96))',      'rgba(140,80,210,0.45)', '#a870e0', 'rgba(140,80,210,0.22)', { color: '#e0d0f8', fontSize: 'clamp(0.72rem,1.1vw,0.88rem)', lineHeight: 1.3, fontWeight: 700, wordBreak: 'break-word' } as React.CSSProperties),

  // Standalone top fields
  impression:  T('linear-gradient(145deg,rgba(4,28,30,0.97),rgba(2,14,16,0.97))',       'rgba(30,180,190,0.45)', '#30d8e0', 'rgba(30,180,190,0.20)', { color: '#b8f0f4', fontStyle: 'italic', fontSize: 'clamp(0.9rem,1.58vw,1.05rem)', lineHeight: 1.46 } as React.CSSProperties),
  appearance:  T('linear-gradient(145deg,rgba(4,22,6,0.97),rgba(2,12,3,0.97))',         'rgba(40,170,60,0.48)',  '#46d460', 'rgba(40,170,60,0.20)',  { color: '#c0f0c8', fontSize: 'clamp(0.78rem,1.22vw,0.9rem)', lineHeight: 1.36 } as React.CSSProperties),

  // Personality group (left column)
  personality: T('linear-gradient(145deg,rgba(30,8,52,0.68),rgba(12,3,22,0.97))',       'rgba(130,55,215,0.52)', '#a868e8', 'rgba(130,55,215,0.24)', { color: '#ddd0f8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  ideal:       T('linear-gradient(145deg,rgba(30,8,52,0.68),rgba(12,3,22,0.97))',       'rgba(130,55,215,0.52)', '#a868e8', 'rgba(130,55,215,0.24)', { color: '#ddd0f8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  bond:        T('linear-gradient(145deg,rgba(18,8,48,0.70),rgba(8,3,26,0.97))',        'rgba(100,80,210,0.50)', '#8878d8', 'rgba(100,80,210,0.22)', { color: '#d4d0f8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  flaw:        T('linear-gradient(145deg,rgba(44,4,8,0.72),rgba(20,2,4,0.97))',         'rgba(200,40,55,0.52)',  '#d84050', 'rgba(200,40,55,0.24)',  { color: '#f8c8cc', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),

  // Story group (right column)
  motivation:  T('linear-gradient(145deg,rgba(4,14,40,0.72),rgba(2,8,24,0.97))',        'rgba(50,110,210,0.50)', '#5a94e0', 'rgba(50,110,210,0.22)', { color: '#c8d8f8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  secret:      T('linear-gradient(145deg,rgba(36,4,4,0.72),rgba(16,2,2,0.97))',         'rgba(170,30,30,0.52)',  '#c83838', 'rgba(170,30,30,0.24)',  { color: '#f4c4c4', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  mannerism:   T('linear-gradient(145deg,rgba(36,16,2,0.72),rgba(18,8,2,0.97))',        'rgba(200,120,20,0.52)', '#e09030', 'rgba(200,120,20,0.24)', { color: '#f4dca8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
  relation:    T('linear-gradient(145deg,rgba(36,24,2,0.72),rgba(18,12,2,0.97))',       'rgba(200,160,20,0.52)', '#d4a820', 'rgba(200,160,20,0.24)', { color: '#f4e4a8', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),

  // Footer
  hook:        T('linear-gradient(145deg,rgba(40,4,4,0.80),rgba(18,2,2,0.98))',         'rgba(190,28,28,0.62)',  '#e04848', 'rgba(190,28,28,0.28)',  { color: '#f8cccc', fontSize: 'clamp(0.88rem,1.56vw,1.04rem)', lineHeight: 1.44, fontWeight: 700 } as React.CSSProperties),
  howtoplay:   T('linear-gradient(145deg,rgba(28,16,2,0.82),rgba(14,8,2,0.98))',        'rgba(158,108,24,0.48)', '#c89020', 'rgba(158,108,24,0.22)', { color: '#f0dcaa', fontStyle: 'italic', fontSize: 'clamp(0.86rem,1.52vw,1.0rem)', lineHeight: 1.44 } as React.CSSProperties),
}

type CardVariant = keyof typeof CARD_THEMES

function InfoCard({ title, children, onReroll, variant = 'personality' }: { title: string; children: React.ReactNode; onReroll?: () => void; variant?: CardVariant }) {
  const theme = CARD_THEMES[variant]
  return (
    <section style={{
      position: 'relative',
      padding: variant === 'accent' ? '14px 14px' : '10px 12px',
      border: `1px solid ${theme.border}`,
      background: theme.bg,
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.42), 0 3px 12px rgba(0,0,0,0.24)',
      minWidth: 0, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h3 className="font-cinzel" style={{
          margin: 0, color: theme.title,
          fontSize: variant === 'accent' ? '0.69rem' : '0.67rem',
          letterSpacing: '0.13em', fontWeight: 800, textTransform: 'uppercase',
        }}>{title}</h3>
        <span style={{ flex: 1, height: 1, background: theme.divider }} />
        <SmallReroll onClick={onReroll} />
      </div>
      <div className="font-crimson" style={theme.text}>
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
      gridTemplateRows: 'auto 1fr auto',
      gap: 10,
      padding: 18,
      overflow: 'visible',
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
          <h1 className="font-cinzel-decorative uppercase" style={{ margin: 0, color: '#f0dfb4', fontSize: 'clamp(1.35rem, 3.2vw, 1.95rem)', lineHeight: 0.98, letterSpacing: '0.035em', textShadow: '0 2px 16px rgba(0,0,0,0.85)' }}>{character.name}</h1>
          <p className="font-cinzel" style={{ margin: '8px 0 0', color: '#caa85a', fontSize: 'clamp(0.76rem,1.32vw,0.92rem)', letterSpacing: '0.10em' }}>{tr(character, lang, 'species')} · {tr(character, lang, 'characterClass')} · {t(lang, 'level')} {character.level}</p>
        </div>
        <SmallReroll onClick={onRerollName} title="Rul navn om" />
      </header>

      <main style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '31% 1fr', gap: 12, alignItems: 'start' }}>
        <aside style={{ display: 'grid', gridTemplateRows: 'auto auto auto', gap: 10 }}>
          <div style={{ border: '1px solid rgba(201,168,76,0.28)', background: '#050403', padding: 7, boxShadow: 'inset 0 0 25px rgba(0,0,0,0.65)' }}>
            <div style={{ position: 'relative', aspectRatio: '3 / 4', overflow: 'hidden', background: '#080604' }}>
              <PortraitPanel key={imageUrl ?? 'empty'} {...portraitProps} />
            </div>
          </div>
          <InfoCard title={t(lang, 'appearance')} variant="appearance" onReroll={() => onRerollField('appearance')}>
            <span style={{ fontSize: 'clamp(0.78rem,1.25vw,0.9rem)', lineHeight: 1.35 }}>{trAppearance(character, lang)}</span>
          </InfoCard>
          <InfoCard title={t(lang, 'combatData')} variant="accent">
            {/* Top stats: AC · HP · Init */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginBottom: 8 }}>
              {([
                { label: 'AC',   value: c.armorClass,       color: '#5a9fc8', bg: 'rgba(20,50,80,0.38)' },
                { label: 'HP',   value: c.hitPoints,        color: '#c06060', bg: 'rgba(90,20,20,0.38)' },
                { label: 'Init', value: (() => { const n = parseInt(String(c.initiative).replace(/[^-\d]/g,'')); return (n >= 0 ? '+' : '') + n })(), color: '#e8d5a0', bg: 'rgba(60,45,10,0.55)' },
              ] as const).map(({ label, value, color, bg }) => (
                <div key={label} style={{ textAlign: 'center', borderRadius: 5, border: `1px solid ${color}66`, background: bg, padding: '6px 3px' }}>
                  <div style={{ fontSize: '0.48rem', letterSpacing: '0.1em', color, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '1.0rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                </div>
              ))}
            </div>
            {/* Secondary stats: Speed · PP · CR */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 9 }}>
              {([
                { label: 'Speed', value: c.speed },
                { label: 'PP',    value: c.passivePerception },
                { label: 'CR',    value: c.challenge },
              ] as const).map(({ label, value }) => (
                <div key={label} style={{ textAlign: 'center', borderRadius: 4, border: '1px solid rgba(44,20,5,0.45)', background: 'rgba(0,0,0,0.22)', padding: '4px 2px' }}>
                  <div style={{ fontSize: '0.46rem', letterSpacing: '0.09em', color: 'rgba(48,20,5,0.80)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2a1304', lineHeight: 1.1 }}>{value}</div>
                </div>
              ))}
            </div>
            {/* Ability scores with modifier */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginBottom: 10 }}>
              {abilityRows.map(([abbr, key]) => {
                const score = abilities[key]
                const mod = Math.floor((score - 10) / 2)
                const modStr = (mod >= 0 ? '+' : '') + mod
                return (
                  <div key={abbr} style={{ textAlign: 'center', borderRadius: 4, border: '1px solid rgba(44,20,5,0.38)', background: 'rgba(0,0,0,0.18)', padding: '4px 1px' }}>
                    <div style={{ fontSize: '0.46rem', letterSpacing: '0.06em', color: 'rgba(48,20,5,0.72)', textTransform: 'uppercase', fontWeight: 700 }}>{abbr}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#2a1304', lineHeight: 1 }}>{score}</div>
                    <div style={{ fontSize: '0.50rem', color: mod >= 0 ? '#2a5c2a' : '#7a2020', fontWeight: 700 }}>{modStr}</div>
                  </div>
                )
              })}
            </div>
            {/* Weapons at bottom — name first, stats below; weapon names translated by lang */}
            <div style={{ borderTop: '1px solid rgba(44,20,5,0.35)', paddingTop: 9, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'M', kind: lang === 'en' ? 'Melee' : 'Nærkamp', name: lang === 'en' ? translateWeaponToEn(c.melee.name) : c.melee.name, toHit: c.melee.toHit, damage: c.melee.damage },
                { label: 'R', kind: lang === 'en' ? 'Range'  : 'Distance', name: lang === 'en' ? translateWeaponToEn(c.ranged.name) : c.ranged.name, toHit: c.ranged.toHit, damage: c.ranged.damage },
              ].map(({ label, kind, name, toHit, damage }) => (
                <div key={kind} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1px 7px' }}>
                  <div style={{
                    gridRow: '1 / 3', alignSelf: 'center',
                    width: 18, height: 18, borderRadius: 3,
                    background: 'rgba(42,19,4,0.30)', border: '1px solid rgba(42,19,4,0.45)',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                    fontSize: '0.56rem', fontWeight: 800, letterSpacing: '0.04em',
                    color: '#3a1f08', fontFamily: 'var(--font-cinzel)',
                  }}>{label}</div>
                  <span style={{ fontWeight: 700, color: '#2a1304', fontSize: '0.78rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ fontWeight: 600, color: 'rgba(42,19,4,0.72)', textTransform: 'uppercase', fontSize: '0.52rem', letterSpacing: '0.07em', lineHeight: 1.2 }}>{kind} · {toHit} · {damage}</span>
                </div>
              ))}
            </div>
            {/* Special ability — 1 class-specific ability for flavour */}
            {(() => {
              const abilities = lang === 'en' ? c.specialAbilitiesEn : c.specialAbilities
              const ability = abilities?.[0]
              if (!ability) return null
              const [abilityName, ...rest] = ability.split(':')
              return (
                <div style={{ borderTop: '1px solid rgba(44,20,5,0.22)', paddingTop: 5, marginTop: 2 }}>
                  <span style={{ fontWeight: 800, color: '#3a1f08', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{abilityName}</span>
                  {rest.length > 0 && <span style={{ color: 'rgba(42,19,4,0.72)', fontSize: '0.60rem', lineHeight: 1.25, display: 'block', marginTop: 1 }}>{rest.join(':').trim()}</span>}
                </div>
              )
            })()}
          </InfoCard>
        </aside>

        <section style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 10 }}>
          <InfoCard title={t(lang, 'firstImpression')} variant="impression">
            {tr(character, lang, 'firstImpression')}
          </InfoCard>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
            <InfoCard title={t(lang, 'race')} variant="stat"><b style={{ fontSize: 'clamp(0.72rem,1.1vw,0.88rem)', wordBreak: 'break-word', hyphens: 'auto' }}>{tr(character, lang, 'species')}</b></InfoCard>
            <InfoCard title={t(lang, 'class')} variant="stat"><b style={{ fontSize: 'clamp(0.72rem,1.1vw,0.88rem)', wordBreak: 'break-word', hyphens: 'auto' }}>{tr(character, lang, 'characterClass')}</b></InfoCard>
            <InfoCard title={t(lang, 'alignment')} variant="stat"><b style={{ fontSize: 'clamp(0.72rem,1.1vw,0.88rem)', wordBreak: 'break-word', hyphens: 'auto' }}>{tr(character, lang, 'alignment')}</b></InfoCard>
            <InfoCard title={t(lang, 'level')} variant="stat"><b style={{ fontSize: 'clamp(0.72rem,1.1vw,0.88rem)' }}>{character.level}</b></InfoCard>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3px 1fr', gap: '0 8px' }}>
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <InfoCard variant="personality" title={t(lang, 'personalityTrait')} onReroll={() => onRerollField('personalityTrait')}>{tr(character, lang, 'personalityTrait')}</InfoCard>
              <InfoCard variant="ideal"       title={t(lang, 'ideal')}            onReroll={() => onRerollField('ideal')}>{tr(character, lang, 'ideal')}</InfoCard>
              <InfoCard variant="bond"        title={t(lang, 'bond')}             onReroll={() => onRerollField('bond')}>{tr(character, lang, 'bond')}</InfoCard>
              <InfoCard variant="flaw"        title={t(lang, 'flaw')}             onReroll={() => onRerollField('flaw')}>{tr(character, lang, 'flaw')}</InfoCard>
            </div>
            {/* vertical divider — gradient blending purple → blue */}
            <div style={{ background: 'linear-gradient(to bottom, transparent 5%, rgba(115,65,200,0.25) 25%, rgba(50,100,200,0.25) 75%, transparent 95%)', borderRadius: 2 }} />
            <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <InfoCard variant="motivation" title={t(lang, 'motivation')} onReroll={() => onRerollField('motivation')}>{tr(character, lang, 'motivation')}</InfoCard>
              <InfoCard variant="secret"     title={t(lang, 'secret')}     onReroll={() => onRerollField('secret')}>{tr(character, lang, 'secret')}</InfoCard>
              <InfoCard variant="mannerism"  title={t(lang, 'mannerism')}  onReroll={() => onRerollField('mannerism')}>{tr(character, lang, 'mannerism')}</InfoCard>
              <InfoCard variant="relation"   title={t(lang, 'relation')}   onReroll={() => onRerollField('relationship')}>{tr(character, lang, 'relationship')}</InfoCard>
            </div>
          </div>
        </section>
      </main>

      {/* ── Full-width footer row: Scene Hook + How To Play ─────────────── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: character.howToPlay ? '1fr 1fr' : '1fr', gap: 10, marginTop: 2 }}>
        <InfoCard variant="hook" title={t(lang, 'sceneHook')} onReroll={() => onRerollField('sceneHook')}>
          <strong>{tr(character, lang, 'sceneHook')}</strong>
        </InfoCard>
        {character.howToPlay && (
          <InfoCard variant="howtoplay" title={t(lang, 'howToPlay')}>
            <em>{character.translations?.[lang]?.howToPlay ?? character.howToPlay}</em>
          </InfoCard>
        )}
      </div>

      <footer className="font-cinzel" style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(201,168,76,0.14)', marginTop: 4, paddingTop: 8, color: 'rgba(201,168,76,0.38)', letterSpacing: '0.18em', fontSize: '0.52rem', textAlign: 'center' }}>
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
      style={{ position: 'relative', maxWidth: 760 }}
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
