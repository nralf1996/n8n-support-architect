'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { PackagedListing, Asset } from '@/lib/assetPackager'

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESETS = [
  { id: 'bol', label: 'bol.com', badge: 'Aanbevolen' },
  { id: 'amazon', label: 'Amazon', badge: null },
  { id: 'shopify', label: 'Shopify', badge: null },
]

const STEPS = [
  { id: 'upload', label: 'Afbeelding uploaden' },
  { id: 'background', label: 'Achtergrond verwijderen' },
  { id: 'describe', label: 'Product analyseren' },
  { id: 'angles', label: 'Hoeken genereren' },
  { id: 'package', label: 'Bestanden klaarzetten' },
]

// Simulated step timing (ms) — keeps the UI informative during the API call
const STEP_DURATIONS = [800, 5000, 3000, 12000, 1000]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function typeLabel(type: Asset['type']): string {
  return (
    {
      main: 'Hoofdafbeelding',
      angle_side: 'Zijkant',
      angle_perspective: 'Perspectief',
      label: 'Label',
    }[type] ?? type
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [preset, setPreset] = useState<string>('bol')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<PackagedListing | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Advance fake progress steps while awaiting the API
  const startFakeProgress = useCallback(() => {
    let step = 0
    const advance = () => {
      if (step < STEPS.length - 1) {
        step++
        setCurrentStep(step)
        stepTimerRef.current = setTimeout(advance, STEP_DURATIONS[step])
      }
    }
    stepTimerRef.current = setTimeout(advance, STEP_DURATIONS[0])
  }, [])

  const clearFakeProgress = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current)
  }, [])

  useEffect(() => () => clearFakeProgress(), [clearFakeProgress])

  // ── File handling ──────────────────────────────────────────────────────────

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) return
    setFile(f)
    setStatus('idle')
    setResult(null)
    setErrorMsg(null)
    const url = URL.createObjectURL(f)
    setPreview(url)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setIsDragging(false), [])

  // ── Generate ───────────────────────────────────────────────────────────────

  async function generate() {
    if (!file) return

    setStatus('processing')
    setCurrentStep(0)
    setErrorMsg(null)
    setResult(null)
    startFakeProgress()

    try {
      const form = new FormData()
      form.append('image', file)
      form.append('preset', preset)

      const res = await fetch('/api/generate', { method: 'POST', body: form })
      clearFakeProgress()

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Onbekende fout.' })) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const listing = await res.json() as PackagedListing
      setCurrentStep(STEPS.length - 1)
      setResult(listing)
      setStatus('done')
    } catch (err) {
      clearFakeProgress()
      setErrorMsg(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
      setStatus('error')
    }
  }

  // ── ZIP download ───────────────────────────────────────────────────────────

  async function downloadZip() {
    if (!result) return
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    result.assets.forEach(a => zip.file(a.filename, a.base64, { base64: true }))
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-${result.presetId}-${result.requestId.slice(-8)}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BOL Listing Generator</h1>
            <p className="text-sm text-gray-500">1 foto → 5 listing-klare afbeeldingen</p>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">
            MVP
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* ── Upload + settings ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload zone */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productfoto uploaden
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative cursor-pointer rounded-xl border-2 border-dashed transition-colors
                flex items-center justify-center overflow-hidden
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'}
                ${preview ? 'h-56' : 'h-56'}
              `}
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="h-full w-full object-contain p-4" />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium bg-black/60 px-3 py-1 rounded-full transition-opacity">
                      Andere foto kiezen
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center px-6">
                  <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Klik om te uploaden</span>
                    {' '}of sleep je foto hierheen
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG of WebP · max 25 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileInput}
            />
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform preset</label>
              <div className="space-y-2">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPreset(p.id)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors
                      ${preset === p.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    <span>{p.label}</span>
                    {p.badge && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {p.badge}
                      </span>
                    )}
                    {preset === p.id && !p.badge && (
                      <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!file || status === 'processing'}
              className={`
                w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all
                ${!file || status === 'processing'
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95'}
              `}
            >
              {status === 'processing' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verwerken...
                </span>
              ) : 'Listing genereren'}
            </button>
          </div>
        </div>

        {/* ── Progress ── */}
        {status === 'processing' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline wordt uitgevoerd</h2>
            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <div className={`
                      h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                      ${done ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-gray-200'}
                    `}>
                      {done ? (
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : active ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <span className={`text-sm ${done ? 'text-gray-500 line-through' : active ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="mt-4 text-xs text-gray-400">Duurt ongeveer 20–30 seconden</p>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex gap-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Er is iets misgegaan</p>
              <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {status === 'done' && result && (
          <div className="space-y-6">
            {/* Summary bar */}
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {result.totalAssets} afbeeldingen klaar voor {result.presetName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Verwerkt in {(result.processingTimeMs / 1000).toFixed(1)}s
                    {result.compliance.passed
                      ? ' · Compliant ✓'
                      : ` · ${result.compliance.violations.length} schending(en)`}
                  </p>
                </div>
              </div>
              <button
                onClick={downloadZip}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download ZIP
              </button>
            </div>

            {/* Warnings */}
            {result.compliance.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-1">Aandachtspunten</p>
                {result.compliance.warnings.map((w, i) => (
                  <p key={i} className="text-sm text-amber-700">{w}</p>
                ))}
              </div>
            )}

            {/* Asset grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {result.assets.map(asset => (
                <AssetCard key={asset.filename} asset={asset} />
              ))}
            </div>

            {/* Instructions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload instructies</h3>
              <ol className="space-y-1.5">
                {result.downloadInstructions.map((line, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400 flex-shrink-0 font-mono text-xs mt-0.5">{i + 1}.</span>
                    {line}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Asset card ───────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: Asset }) {
  function download() {
    const a = document.createElement('a')
    a.href = `data:image/jpeg;base64,${asset.base64}`
    a.download = asset.filename
    a.click()
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
      <div className="relative bg-gray-50 h-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${asset.base64}`}
          alt={asset.filename}
          className="h-full w-full object-contain p-2"
        />
        <button
          onClick={download}
          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors"
        >
          <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full transition-opacity flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </span>
        </button>
      </div>
      <div className="px-3 py-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-800 truncate font-mono">{asset.filename}</p>
        <p className="text-xs text-gray-400 mt-0.5">{typeLabel(asset.type)} · {humanSize(asset.sizeBytes)}</p>
      </div>
    </div>
  )
}
