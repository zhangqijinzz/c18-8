import { useEffect, useState } from 'react'
import { normalizeColor } from '../domain/brandRules'
import type { BrandMirrorSnapshot, BrandTheme } from '../models/brandMirrorModels'

interface TokenControlsProps {
  snapshot: BrandMirrorSnapshot
  onThemeChange: (theme: BrandTheme) => void
  onColorChange: (field: 'primary' | 'secondary', value: string) => void
  onScaleChange: (field: 'radiusScale' | 'spacingScale' | 'typeScale', index: number, value: number) => void
  onReset: () => void
}

const themes: { id: BrandTheme; label: string; note: string }[] = [
  { id: 'studio', label: 'Studio warm', note: '热烈 · 友好' },
  { id: 'editorial', label: 'Editorial green', note: '克制 · 自然' },
  { id: 'night', label: 'Night signal', note: '锐利 · 数字' },
]

export function TokenControls({ snapshot, onThemeChange, onColorChange, onScaleChange, onReset }: TokenControlsProps) {
  return (
    <aside className="control-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">01 / TOKENS</span>
          <h2>视觉令牌</h2>
        </div>
        <button className="text-button" type="button" onClick={onReset}>恢复默认</button>
      </div>

      <section className="control-section">
        <div className="section-label"><span>基础主题</span><span className="muted">快速起点</span></div>
        <div className="theme-list">
          {themes.map((theme) => (
            <button className={`theme-option ${snapshot.theme === theme.id ? 'selected' : ''}`} key={theme.id} onClick={() => onThemeChange(theme.id)} type="button">
              <span className={`theme-dot ${theme.id}`} />
              <span><strong>{theme.label}</strong><small>{theme.note}</small></span>
              {snapshot.theme === theme.id && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="control-section">
        <div className="section-label"><span>品牌色</span><span className="muted">HEX / 6 位</span></div>
        <div className="color-fields">
          <ColorField label="主色" value={snapshot.tokens.primary} onChange={(value) => onColorChange('primary', value)} />
          <ColorField label="辅助色" value={snapshot.tokens.secondary} onChange={(value) => onColorChange('secondary', value)} />        </div>
        <div className={`contrast-note ${snapshot.contrastWarning ? 'warning' : ''}`}>
          <span className="contrast-icon">◐</span>
          <span>对比度 <strong>{snapshot.contrastRatio.toFixed(1)}:1</strong> · {snapshot.contrastWarning ? '建议提高对比度' : '适合界面使用'}</span>
        </div>
      </section>

      <ScaleControl label="圆角尺度" hint="px" values={snapshot.tokens.radiusScale} field="radiusScale" onChange={onScaleChange} />
      <ScaleControl label="间距体系" hint="px" values={snapshot.tokens.spacingScale} field="spacingScale" onChange={onScaleChange} />
      <ScaleControl label="字体比例" hint="px" values={snapshot.tokens.typeScale} field="typeScale" onChange={onScaleChange} />

      <div className="panel-footer"><span className="live-dot" />所有调整实时同步到预览</div>
    </aside>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  // value 是已确认的有效值；draft 是用户正在编辑、尚未确认的内容。
  // 编辑过程中绝不用外部值覆盖输入框，避免两个颜色串在一起。
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState<string | null>(null)

  // 外部值变化（主题切换、恢复默认、取色器选择）且当前不在编辑时，同步草稿
  useEffect(() => {
    setDraft(value)
    setError(null)
  }, [value])

  const commit = (raw: string) => {
    const normalized = normalizeColor(raw)
    if (!normalized) {
      setError('请输入 6 位 HEX 颜色，如 #2A6BFF')
      setDraft(value) // 退回上一个有效值
      return
    }
    setError(null)
    setDraft(normalized)
    onChange(normalized)
  }

  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-field-control">
        <span className={`color-input${error ? ' invalid' : ''}`}>
          <input
            aria-label={label}
            type="color"
            value={value}
            onChange={(event) => commit(event.target.value)}
          />
          <input
            aria-label={`${label} HEX`}
            aria-invalid={error ? true : undefined}
            value={draft}
            spellCheck={false}
            placeholder="#000000"
            onChange={(event) => { setDraft(event.target.value); setError(null) }}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit(event.currentTarget.value)
              if (event.key === 'Escape') { setDraft(value); setError(null) }
            }}
          />
        </span>
        {error && <span className="color-field-error" role="alert">{error}</span>}
      </span>
    </label>
  )
}

function ScaleControl({ label, hint, values, field, onChange }: { label: string; hint: string; values: number[]; field: 'radiusScale' | 'spacingScale' | 'typeScale'; onChange: (field: 'radiusScale' | 'spacingScale' | 'typeScale', index: number, value: number) => void }) {
  return <section className="control-section scale-section"><div className="section-label"><span>{label}</span><span className="muted">{hint}</span></div><div className="scale-inputs">{values.map((value, index) => <label key={`${field}-${index}`}><span>{index + 1}</span><input aria-label={`${label}${index + 1}`} type="number" min={field === 'typeScale' ? 10 : 0} max={field === 'typeScale' ? 72 : field === 'spacingScale' ? 64 : 40} value={value} onChange={(event) => onChange(field, index, Number(event.target.value))} /></label>)}</div></section>
}
