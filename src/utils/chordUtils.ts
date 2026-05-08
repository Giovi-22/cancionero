
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Normaliza un nombre de nota a su índice en la escala cromática (0-11)
 */
function getNoteIndex(note: string): number {
  const normalizedNote = note.charAt(0).toUpperCase() + note.slice(1);
  let index = NOTES_SHARP.indexOf(normalizedNote);
  if (index === -1) {
    index = NOTES_FLAT.indexOf(normalizedNote);
  }
  return index;
}

/**
 * Transpone un acorde individual
 */
export function transposeChord(chord: string, semitones: number): string {
  // Regex para separar la nota base del resto (m7, maj9, etc.)
  // Ejemplo: "C#m7/G" -> base: "C#", suffix: "m7", bass: "/G"
  const match = chord.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return chord;

  const [_, baseNote, suffix] = match;
  
  // Manejar acordes con bajo (ej: C/G)
  if (suffix.includes('/')) {
    const [rest, bassNote] = suffix.split('/');
    const newBase = transposeNote(baseNote, semitones);
    const newBass = transposeNote(bassNote, semitones);
    return `${newBase}${rest}/${newBass}`;
  }

  return `${transposeNote(baseNote, semitones)}${suffix}`;
}

function transposeNote(note: string, semitones: number): string {
  const index = getNoteIndex(note);
  if (index === -1) return note;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Preferimos sostenidos o bemoles dependiendo de la nota original
  // o podemos ser inteligentes y ver el contexto. Por ahora, SHARP por defecto.
  return note.includes('b') ? NOTES_FLAT[newIndex] : NOTES_SHARP[newIndex];
}

/**
 * Detecta si una línea de texto es probablemente una línea de acordes
 */
export function isChordLine(line: string): boolean {
  // Eliminar espacios
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Un criterio simple: la mayoría de los "tokens" deben parecer acordes
  const tokens = trimmed.split(/\s+/);
  const chordRegex = /^[A-G][b#]?(m|maj|dim|aug|sus|add|v|i|[0-9])?.*$/i;
  
  let chordCount = 0;
  for (const token of tokens) {
    if (chordRegex.test(token)) {
      chordCount++;
    }
  }

  // Si más del 70% de los tokens son acordes, asumimos que es una línea de acordes
  return chordCount / tokens.length > 0.6; // Bajamos un poco el umbral
}

/**
 * Transpone un bloque de texto completo
 */
export function transposeText(text: string, semitones: number): string {
  if (semitones === 0) return text;
  
  const lines = text.split('\n');
  const transposedLines = lines.map(line => {
    if (isChordLine(line)) {
      let result = '';
      let lastIndex = 0;
      
      // Buscamos tokens que parezcan acordes pero preservamos su posición
      // Dividimos por grupos de espacios y no-espacios
      const parts = line.split(/(\s+)/);
      
      return parts.map(part => {
        if (part.trim() && /^[A-G][b#]?(m|maj|min|dim|aug|sus|add|v|i|[0-9]|\/)*$/i.test(part.trim())) {
          const originalChord = part.trim();
          const newChord = transposeChord(originalChord, semitones);
          
          // Si el nuevo acorde es más largo o corto, esto es un intento simple
          // de mantener la alineación, aunque en texto plano es difícil.
          return newChord;
        }
        return part;
      }).join('');
    }
    return line;
  });

  return transposedLines.join('\n');
}

/**
 * Elimina la sangría común de un bloque de texto
 */
export function trimCommonIndentation(text: string): string {
  const lines = text.split('\n');
  
  // Encontrar el mínimo de espacios al principio (ignorando líneas vacías)
  const minIndent = lines.reduce((min, line) => {
    if (line.trim().length === 0) return min;
    const match = line.match(/^\s*/);
    const indent = match ? match[0].length : 0;
    return Math.min(min, indent);
  }, Infinity);

  if (minIndent === Infinity || minIndent === 0) return text;

  return lines
    .map(line => line.length >= minIndent ? line.substring(minIndent) : line.trim())
    .join('\n');
}

/**
 * Limpia el texto de una canción eliminando espacios excesivos
 * producidos por pies de página de Google Docs o saltos de página.
 */
export function cleanSongText(text: string): string {
  if (!text) return '';
  
  // 1. Normalizar saltos de línea y limpiar espacios al final de cada línea
  let cleaned = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');

  // 2. Colapsar múltiples líneas en blanco a máximo una
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 3. Asegurar que las etiquetas de sección (ej: [CORO]) tengan una línea en blanco antes
  // Buscamos cualquier línea que empiece con [ y nos aseguramos que tenga \n\n antes
  const lines = cleaned.split('\n');
  const resultLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isSectionHeader = line.trim().startsWith('[');
    
    // Si es una cabecera de sección y no es la primera línea, 
    // y la línea anterior no está vacía, insertamos una línea vacía.
    if (isSectionHeader && i > 0 && resultLines[resultLines.length - 1] !== '') {
      resultLines.push('');
    }
    
    resultLines.push(line);
  }

  return resultLines.join('\n').trim();
}

/**
 * Calcula los semitonos necesarios para un capodastro
 * Si el capo está en el traste 4, y quiero ver los acordes "fáciles",
 * tengo que restar 4 semitonos a la visualización.
 */
export function getCapoOffset(capoFret: number): number {
  return -capoFret;
}
