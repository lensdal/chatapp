export type AttachmentKind = 'pdf' | 'image' | 'doc' | 'sheet'
export interface Attachment {
  name: string
  kind: AttachmentKind
  dataUrl?: string
}

export function kindFromName(nameOrType: string): AttachmentKind {
  const s = nameOrType.toLowerCase()
  if (s.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif)$/.test(s)) return 'image'
  if (s.includes('pdf')) return 'pdf'
  if (/\.(xlsx?|csv|numbers)$/.test(s) || s.includes('spreadsheet')) return 'sheet'
  return 'doc'
}

// Downscale a photo through a canvas so a phone snapshot doesn't overflow
// localStorage. Returns a compressed JPEG data URL.
function downscaleImage(file: File, maxDim = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('no canvas'))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

export async function readAsAttachment(file: File): Promise<Attachment> {
  const kind = kindFromName(file.type || file.name)
  if (kind === 'image') {
    try {
      const dataUrl = await downscaleImage(file)
      return { name: file.name || 'Photo.jpg', kind, dataUrl }
    } catch {
      return { name: file.name || 'Photo.jpg', kind }
    }
  }
  return { name: file.name || 'Document', kind }
}
