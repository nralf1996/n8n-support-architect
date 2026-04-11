import { NextResponse } from 'next/server'
import {
  removeBackground,
  describeProduct,
  generateAngle,
  detectLabel,
} from '@/lib/pipeline'
import { packageAssets } from '@/lib/assetPackager'

// Allow up to 60s on Vercel (Pro) — image processing takes ~20-30s
export const maxDuration = 60

export async function POST(request: Request) {
  const startTime = Date.now()

  let base64: string
  let preset: string

  try {
    const form = await request.formData()
    const file = form.get('image') as File | null
    preset = (form.get('preset') as string | null) ?? 'bol'

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 })
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large. Maximum is 25 MB.' }, { status: 400 })
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported format: ${file.type}. Use JPEG, PNG, or WebP.` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    base64 = buffer.toString('base64')
  } catch {
    return NextResponse.json({ error: 'Failed to read uploaded image.' }, { status: 400 })
  }

  // Step 1 — Remove background (blocking: all other steps need this result)
  const bgResult = await removeBackground(base64)
  if (!bgResult.success || !bgResult.base64) {
    return NextResponse.json(
      {
        error: 'Background removal failed.',
        detail: bgResult.error ?? 'Remove.bg returned an empty response.',
        hint: 'Check that REMOVEBG_API_KEY is set and the image is a clear product photo.',
      },
      { status: 502 }
    )
  }

  // Step 2 — Describe product (needed for angle prompts; fails gracefully)
  const description = await describeProduct(base64)

  // Step 3 — Angles + label detection in parallel (each fails gracefully)
  const [angle01, angle02, label] = await Promise.allSettled([
    generateAngle(description.photographyPrompt, 'side_left', preset),
    generateAngle(description.photographyPrompt, 'perspective', preset),
    detectLabel(base64),
  ])

  const angle01Base64 =
    angle01.status === 'fulfilled' && angle01.value.success ? (angle01.value.base64 ?? null) : null

  const angle02Base64 =
    angle02.status === 'fulfilled' && angle02.value.success ? (angle02.value.base64 ?? null) : null

  const labelDetection =
    label.status === 'fulfilled' ? label.value : null

  // Step 4 — Package
  const listing = packageAssets({
    requestId: `bol_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    preset,
    startTime,
    mainBase64: bgResult.base64,
    angle01Base64,
    angle02Base64,
    labelDetection,
  })

  return NextResponse.json(listing)
}
