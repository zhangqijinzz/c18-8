// @vitest-environment jsdom
import { act } from 'react'
import { useEffect, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BrandMirrorViewModel } from '../viewmodels/brandMirrorViewModel'
import type { BrandDocument } from '../models/brandMirrorModels'
import type { BrandRepository } from '../repositories/brandRepository'
import { TokenControls } from '../token-editor/TokenControls'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

class MemoryRepository implements BrandRepository {
  document: BrandDocument | null = null
  load(): BrandDocument | null { return this.document }
  save(document: BrandDocument): void { this.document = document }
}

function Harness({ viewModel }: { viewModel: BrandMirrorViewModel }) {
  const [snapshot, setSnapshot] = useState(viewModel.getSnapshot())
  useEffect(() => viewModel.subscribe(() => setSnapshot(viewModel.getSnapshot())), [viewModel])
  return (
    <TokenControls
      snapshot={snapshot}
      onThemeChange={(theme) => viewModel.selectTheme(theme)}
      onColorChange={(field, value) => viewModel.updateColor(field, value)}
      onScaleChange={(field, index, value) => viewModel.updateScale(field, index, value)}
      onReset={() => viewModel.reset()}
    />
  )
}

const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set

function typeInto(input: HTMLInputElement, value: string): void {
  if (!valueSetter) throw new Error('missing input value setter')
  valueSetter.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function press(input: HTMLInputElement, key: string): void {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('TokenControls color fields', () => {
  let container: HTMLDivElement
  let root: Root
  let repository: MemoryRepository
  let viewModel: BrandMirrorViewModel

  function hexInput(label: string): HTMLInputElement {
    const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label} HEX"]`)
    if (!input) throw new Error(`missing HEX input for ${label}`)
    return input
  }

  beforeEach(() => {
    repository = new MemoryRepository()
    viewModel = new BrandMirrorViewModel(repository)
    viewModel.initialize()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root.render(<Harness viewModel={viewModel} />))
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('keeps the in-progress draft while typing and touches neither tokens nor storage', () => {
    const input = hexInput('辅助色')
    act(() => input.focus())
    act(() => typeInto(input, '#24'))
    act(() => typeInto(input, 'zzz'))
    expect(input.value).toBe('zzz')
    expect(viewModel.getSnapshot().tokens.secondary).toBe('#24324A')
    expect(repository.document).toBeNull()
  })

  it('rejects an invalid value on commit, keeps the last valid color and explains why', () => {
    const input = hexInput('辅助色')
    act(() => input.focus())
    act(() => typeInto(input, 'not-a-color'))
    act(() => input.blur())
    expect(input.value).toBe('#24324A')
    expect(viewModel.getSnapshot().tokens.secondary).toBe('#24324A')
    expect(viewModel.getSnapshot().tokens.primary).toBe('#F15A47')
    expect(viewModel.getSnapshot().message).toContain('HEX')
    expect(viewModel.getSnapshot().message).toContain('辅助色')
    expect(repository.document).toBeNull()
  })

  it('commits a confirmed valid color on Enter and persists it normalized', () => {
    const input = hexInput('辅助色')
    act(() => input.focus())
    act(() => typeInto(input, '#a1b2c3'))
    act(() => press(input, 'Enter'))
    expect(input.value).toBe('#A1B2C3')
    expect(viewModel.getSnapshot().tokens.secondary).toBe('#A1B2C3')
    expect(repository.document?.tokens.secondary).toBe('#A1B2C3')
  })

  it('discards the draft on Escape without committing', () => {
    const input = hexInput('主色')
    act(() => input.focus())
    act(() => typeInto(input, '#000000'))
    act(() => press(input, 'Escape'))
    expect(input.value).toBe('#F15A47')
    expect(viewModel.getSnapshot().tokens.primary).toBe('#F15A47')
    expect(repository.document).toBeNull()
  })
})
