import { PRESETS } from './presets'
import type { LabelDetection } from './pipeline'

export interface Asset {
  filename: string
  type: 'main' | 'angle_side' | 'angle_perspective' | 'label'
  base64: string
  format: 'jpeg'
  sizeBytes: number
}

export interface PackagedListing {
  requestId: string
  presetId: string
  presetName: string
  assets: Asset[]
  totalAssets: number
  labelDetection: LabelDetection | null
  compliance: {
    passed: boolean
    violations: string[]
    warnings: string[]
  }
  downloadInstructions: string[]
  processingTimeMs: number
  createdAt: string
}

interface PackageInput {
  requestId: string
  preset: string
  startTime: number
  mainBase64: string
  angle01Base64: string | null
  angle02Base64: string | null
  labelDetection: LabelDetection | null
}

export function packageAssets(input: PackageInput): PackagedListing {
  const preset = PRESETS[input.preset] ?? PRESETS.bol
  const assets: Asset[] = []

  function add(base64: string | null, type: Asset['type'], filename: string) {
    if (!base64) return
    assets.push({
      filename,
      type,
      base64,
      format: 'jpeg',
      sizeBytes: Math.ceil(base64.length * 0.75),
    })
  }

  add(input.mainBase64, 'main', preset.fileNaming.main)
  add(input.angle01Base64, 'angle_side', preset.fileNaming.angles[0])
  add(input.angle02Base64, 'angle_perspective', preset.fileNaming.angles[1])

  const violations: string[] = []
  const warnings: string[] = []

  if (input.labelDetection?.complianceCritical) {
    warnings.push(
      `Compliance label detected (${input.labelDetection.labelType}). ` +
        `Consider uploading a separate clear label photo as "${preset.fileNaming.label}".`
    )
  }

  return {
    requestId: input.requestId,
    presetId: input.preset,
    presetName: preset.name,
    assets,
    totalAssets: assets.length,
    labelDetection: input.labelDetection,
    compliance: {
      passed: violations.length === 0,
      violations,
      warnings,
    },
    downloadInstructions: buildInstructions(input.preset, preset.fileNaming.main),
    processingTimeMs: Date.now() - input.startTime,
    createdAt: new Date().toISOString(),
  }
}

function buildInstructions(presetId: string, mainFilename: string): string[] {
  const base = [
    'Each image is a base64-encoded JPEG — decode and save with the exact filename shown.',
    'Use the "Download ZIP" button to get all files named and ready to upload.',
  ]

  const platform: Record<string, string[]> = {
    bol: [
      `bol.com: Verkoper dashboard → Productbeheer → select product → Afbeeldingen`,
      `Upload "${mainFilename}" as the primary image first.`,
      'bol.com rejects main images with text, props, or coloured backgrounds.',
    ],
    amazon: [
      'Amazon: Seller Central → Manage Inventory → Edit listing → Images tab',
      'Upload MAIN image first. PT01–PT02 are secondary images.',
    ],
    shopify: ['Shopify: Admin → Products → select product → drag images in the order shown.'],
  }

  return [...base, ...(platform[presetId] ?? [])]
}
