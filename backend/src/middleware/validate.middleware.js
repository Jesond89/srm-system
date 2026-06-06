/**
 * Middleware de validación/sanitización de inputs (A03 - Injection)
 * Uso: validate(schema) donde schema es un objeto { campo: { required, maxLength, type } }
 */

// Sanitiza strings: elimina HTML/scripts y recorta espacios
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str
  return str
    .trim()
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')          // strip HTML tags
    .replace(/[<>"'`]/g, (c) => ({   // encode caracteres peligrosos
      '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;',
    }[c]))
}

// Valida y sanitiza el body según un esquema simple
export const validateBody = (schema) => (req, res, next) => {
  const errors = []

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field]

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`El campo '${field}' es requerido`)
      continue
    }
    if (value === undefined || value === null) continue

    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`El campo '${field}' debe ser texto`)
        continue
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`El campo '${field}' no puede exceder ${rules.maxLength} caracteres`)
        continue
      }
      if (rules.minLength && value.trim().length < rules.minLength) {
        errors.push(`El campo '${field}' debe tener al menos ${rules.minLength} caracteres`)
        continue
      }
      if (rules.isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors.push(`El campo '${field}' debe ser un email válido`)
          continue
        }
      }
      // Sanitizar el valor en el body
      if (rules.sanitize !== false) {
        req.body[field] = sanitizeString(value)
      }
    }

    if (rules.type === 'number') {
      const num = Number(value)
      if (isNaN(num)) {
        errors.push(`El campo '${field}' debe ser un número`)
        continue
      }
      if (rules.min !== undefined && num < rules.min) {
        errors.push(`El campo '${field}' debe ser mayor o igual a ${rules.min}`)
      }
      if (rules.max !== undefined && num > rules.max) {
        errors.push(`El campo '${field}' debe ser menor o igual a ${rules.max}`)
      }
    }
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Datos inválidos', detalles: errors })
  }

  next()
}

// Schemas predefinidos
export const schemas = {
  login: {
    email:    { required: true, type: 'string', isEmail: true, maxLength: 255 },
    password: { required: true, type: 'string', minLength: 1, maxLength: 128, sanitize: false },
  },
  chatMessage: {
    message: { required: true, type: 'string', maxLength: 500 },
  },
  proveedor: {
    nombre:    { required: true, type: 'string', maxLength: 200 },
    rfc:       { required: true, type: 'string', maxLength: 13 },
    email:     { required: false, type: 'string', isEmail: true, maxLength: 255 },
    telefono:  { required: false, type: 'string', maxLength: 20 },
    direccion: { required: false, type: 'string', maxLength: 500 },
  },
}
