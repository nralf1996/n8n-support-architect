// Server-side image processing pipeline.
// All external API calls live here — keep route.ts thin.

export interface RemoveBgResult {
  success: boolean
  base64?: string
  error?: string
}

export async function removeBackground(base64: string): Promise<RemoveBgResult> {
  const form = new FormData()
  form.append('image_file_b64', base64)
  form.append('bg_color', 'ffffff')
  form.append('format', 'jpg')
  form.append('size', 'regular')

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': process.env.REMOVEBG_API_KEY! },
    body: form,
  })

  if (!res.ok) {
    let message = `Remove.bg error ${res.status}`
    try {
      const err = await res.json() as { errors?: Array<{ title: string }> }
      message = err.errors?.[0]?.title ?? message
    } catch { /* ignore parse error */ }
    return { success: false, error: message }
  }

  const buffer = await res.arrayBuffer()
  return { success: true, base64: Buffer.from(buffer).toString('base64') }
}

// ─── Product description (for DALL-E prompts) ───────────────────────────────

export interface ProductDescription {
  photographyPrompt: string
  productName: string
}

export async function describeProduct(base64: string): Promise<ProductDescription> {
  const fallback: ProductDescription = {
    photographyPrompt: 'a consumer product on a white background',
    productName: 'Product',
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 400,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
              },
              {
                type: 'text',
                text: `Describe this product for e-commerce photography prompts. Respond in JSON:
{
  "product_name": "short name (e.g. ceramic coffee mug)",
  "color": "primary color(s)",
  "material": "primary material",
  "photography_prompt": "one precise sentence describing the product for DALL-E 3 — include color, material, shape, and any key distinguishing features"
}`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) return fallback

    const data = await res.json() as { choices?: Array<{ message: { content: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallback

    const parsed = JSON.parse(content) as {
      photography_prompt?: string
      product_name?: string
    }
    return {
      photographyPrompt: parsed.photography_prompt ?? fallback.photographyPrompt,
      productName: parsed.product_name ?? fallback.productName,
    }
  } catch {
    return fallback
  }
}

// ─── Angle generation (DALL-E 3) ────────────────────────────────────────────

const ANGLE_DESCRIPTIONS: Record<string, string> = {
  side_left:
    'left side profile view, 90-degree horizontal rotation, showing the complete side of the product cleanly',
  perspective:
    'three-quarter perspective view, 45-degree rotation with 15-degree elevation, showing product depth and dimension',
}

const PRESET_PHOTO_RULES: Record<string, string> = {
  bol: 'pure white background (#FFFFFF), no props, no text, no logos, square 1:1 format, soft studio lighting',
  amazon: 'pure white background (#FFFFFF), no props, no text, professional studio lighting',
  shopify: 'clean white background, consistent studio lighting',
}

export interface AngleResult {
  success: boolean
  base64?: string
  error?: string
}

export async function generateAngle(
  photographyPrompt: string,
  angle: 'side_left' | 'perspective',
  preset: string
): Promise<AngleResult> {
  const rules = PRESET_PHOTO_RULES[preset] ?? PRESET_PHOTO_RULES.bol
  const view = ANGLE_DESCRIPTIONS[angle]
  const prompt =
    `Professional e-commerce product photography. Subject: ${photographyPrompt}. ` +
    `View: ${view}. ` +
    `Requirements: ${rules}. ` +
    `Photorealistic, high-quality. Square 1:1 format.`

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
      }),
    })

    if (!res.ok) return { success: false, error: `DALL-E error ${res.status}` }

    const data = await res.json() as { data?: Array<{ b64_json?: string }>; error?: { message: string } }
    if (data.error) return { success: false, error: data.error.message }

    const b64 = data.data?.[0]?.b64_json
    if (!b64) return { success: false, error: 'No image in DALL-E response' }

    return { success: true, base64: b64 }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Label detection (GPT-4o Vision) ────────────────────────────────────────

export interface LabelDetection {
  hasLabel: boolean
  labelType: 'ingredients' | 'ce_marking' | 'nutrition' | 'barcode' | 'hazard' | 'general' | null
  complianceCritical: boolean
  notes: string[]
}

export async function detectLabel(base64: string): Promise<LabelDetection> {
  const fallback: LabelDetection = {
    hasLabel: false,
    labelType: null,
    complianceCritical: false,
    notes: [],
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' },
              },
              {
                type: 'text',
                text: `Detect compliance labels in this product image. Respond in JSON:
{
  "has_label": boolean,
  "label_type": "ingredients" | "ce_marking" | "nutrition" | "barcode" | "hazard" | "general" | null,
  "compliance_critical": boolean,
  "notes": ["brief observation"]
}

Set compliance_critical to true for CE marking, hazard symbols, ingredient lists, or nutrition tables.`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) return fallback

    const data = await res.json() as { choices?: Array<{ message: { content: string } }> }
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallback

    const parsed = JSON.parse(content) as {
      has_label?: boolean
      label_type?: LabelDetection['labelType']
      compliance_critical?: boolean
      notes?: string[]
    }

    return {
      hasLabel: parsed.has_label ?? false,
      labelType: parsed.label_type ?? null,
      complianceCritical: parsed.compliance_critical ?? false,
      notes: parsed.notes ?? [],
    }
  } catch {
    return fallback
  }
}
