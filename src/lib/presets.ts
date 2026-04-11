// Marketplace preset configurations.
// These rules are enforced automatically — the seller never needs to look them up.

export interface Preset {
  id: string
  name: string
  background: '#FFFFFF'
  minDimension: number
  recommendedDimension: number
  aspectRatio: '1:1' | 'flexible'
  marginPercent: number
  allowProps: boolean
  mainImageRules: string[]
  fileNaming: {
    main: string
    angles: string[]
    detail: string
    label: string
  }
}

export const PRESETS: Record<string, Preset> = {
  bol: {
    id: 'bol',
    name: 'bol.com',
    background: '#FFFFFF',
    minDimension: 800,
    recommendedDimension: 1600,
    aspectRatio: '1:1',
    marginPercent: 5,
    allowProps: false,
    mainImageRules: [
      'Pure white background (#FFFFFF)',
      'Product fills 85–90% of frame',
      'Square 1:1 format',
      'No text, watermarks, or logos on main image',
      'No props or hands',
      'Min 800×800 px — recommended 1600×1600 px',
    ],
    fileNaming: {
      main: 'main_01.jpg',
      angles: ['angle_01.jpg', 'angle_02.jpg', 'angle_03.jpg'],
      detail: 'detail_01.jpg',
      label: 'label_01.jpg',
    },
  },

  amazon: {
    id: 'amazon',
    name: 'Amazon',
    background: '#FFFFFF',
    minDimension: 1000,
    recommendedDimension: 2000,
    aspectRatio: '1:1',
    marginPercent: 7,
    allowProps: false,
    mainImageRules: [
      'Pure white background (#FFFFFF)',
      'Product fills ≥ 85% of image area',
      'No watermarks, borders, or decorations',
      'Min 1000×1000 px (enables zoom feature)',
      'JPEG preferred',
    ],
    fileNaming: {
      main: 'ASIN_MAIN.jpg',
      angles: ['ASIN_PT01.jpg', 'ASIN_PT02.jpg', 'ASIN_PT03.jpg'],
      detail: 'ASIN_PT04.jpg',
      label: 'ASIN_PT05.jpg',
    },
  },

  shopify: {
    id: 'shopify',
    name: 'Shopify',
    background: '#FFFFFF',
    minDimension: 800,
    recommendedDimension: 2048,
    aspectRatio: 'flexible',
    marginPercent: 3,
    allowProps: true,
    mainImageRules: [
      'Consistent style across product catalog',
      'Square or portrait recommended',
      'Max 2048×2048 px for optimal loading',
    ],
    fileNaming: {
      main: 'product-main.jpg',
      angles: ['product-angle-1.jpg', 'product-angle-2.jpg', 'product-angle-3.jpg'],
      detail: 'product-detail.jpg',
      label: 'product-label.jpg',
    },
  },
}

export type PresetId = keyof typeof PRESETS
