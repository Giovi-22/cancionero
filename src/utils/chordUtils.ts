
const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export interface SongBlock {
  chord?: string;
  text: string;
}

export interface SongLineParsed {
  type: 'chords-lyrics' | 'text' | 'section';
  blocks: SongBlock[];
}

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
  // Regex estricto para acordes (evita coincidencias falsas con palabras como "Gloria" o "Dios")
  const chordRegex = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add)?\d*(?:[b#+-]\d+)?(?:\([^)]+\))?(?:\/[A-G][b#]?)?$/i;
  
  let chordCount = 0;
  for (const token of tokens) {
    if (chordRegex.test(token)) {
      chordCount++;
    }
  }

  // Si más del 60% de los tokens son acordes, asumimos que es una línea de acordes
  return chordCount / tokens.length > 0.6;
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
/**
 * Parsea el texto de una canción a una estructura de bloques inteligentes
 * que permiten un diseño responsive donde los acordes siguen a la letra.
 */
export function parseSongToBlocks(text: string): SongLineParsed[] {
  const lines = text.split('\n');
  const result: SongLineParsed[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1];

    // Caso A: Línea de acordes seguida de letra
    if (isChordLine(currentLine) && nextLine !== undefined && !isChordLine(nextLine) && nextLine.trim() !== '') {
      result.push(parseChordsAndLyrics(currentLine, nextLine));
      i++; // Saltamos la línea de letra porque ya la procesamos
      continue;
    }

    // Caso B: Solo una línea de acordes (intro, instrumental, etc)
    if (isChordLine(currentLine)) {
      result.push({
        type: 'chords-lyrics',
        blocks: parseChordsOnly(currentLine)
      });
      continue;
    }

    // Caso C: Encabezado de sección [CORO]
    if (currentLine.trim().startsWith('[')) {
      result.push({
        type: 'section',
        blocks: [{ text: currentLine.trim() }]
      });
      continue;
    }

    // Caso D: Línea de texto normal
    result.push({
      type: 'text',
      blocks: [{ text: currentLine }]
    });
  }

  return result;
}

/**
 * Función interna para emparejar una línea de acordes con una de letra.
 * Respeta los límites de palabras: si un acorde cae en medio de una palabra,
 * se ajusta la división al inicio de esa palabra, para que nunca se corte
 * una palabra entre dos bloques.
 */
function parseChordsAndLyrics(chordLine: string, lyricLine: string): SongLineParsed {
  const blocks: SongBlock[] = []

  // 1. Encontramos todos los acordes y sus posiciones
  const chordRegex = /\S+/g
  let match
  const chords: { chord: string; index: number }[] = []
  while ((match = chordRegex.exec(chordLine)) !== null) {
    chords.push({ chord: match[0], index: match.index })
  }

  if (chords.length === 0) {
    return { type: 'text', blocks: [{ text: lyricLine }] }
  }

  /**
   * Función auxiliar: dado un índice de carácter en la línea de letra,
   * retrocede hasta el inicio de la palabra que contiene ese índice.
   * Si el índice ya es el inicio de una palabra (o hay un espacio antes),
   * lo devuelve tal cual.
   * IMPORTANTE: si el acorde cae dentro de la primera palabra (sin espacios
   * previos), retornamos 0 para que el acorde "adopte" la palabra completa
   * desde el inicio, evitando el efecto ¿A+C pegados.
   */
  function snapToWordStart(pos: number, text: string): number {
    if (pos <= 0 || pos >= text.length) return pos
    // Si el carácter en `pos` es un espacio, ya estamos en un buen límite
    if (text[pos] === ' ') return pos
    // Retroceder hasta encontrar un espacio (inicio de esta palabra)
    let i = pos - 1
    while (i > 0 && text[i] !== ' ') i--
    // Si encontramos un espacio, el inicio de la palabra es i+1
    if (text[i] === ' ') return i + 1
    // No había espacio antes: el acorde cae dentro de la primera palabra.
    // Devolvemos 0 para que el bloque tome desde el inicio de la línea.
    return 0
  }

  // 2. Calculamos los puntos de corte del texto, ajustados a límites de palabras
  const cutPoints: number[] = []
  for (const c of chords) {
    cutPoints.push(snapToWordStart(c.index, lyricLine))
  }

  // 3. Texto antes del primer acorde (si el primer corte no es el inicio)
  if (cutPoints[0] > 0) {
    blocks.push({ text: lyricLine.substring(0, cutPoints[0]) })
  }

  // 4. Emparejamos cada acorde con el segmento de texto correspondiente
  for (let i = 0; i < chords.length; i++) {
    const textStart = cutPoints[i]
    const textEnd = i + 1 < cutPoints.length
      ? cutPoints[i + 1]
      : lyricLine.length // Último acorde toma el resto de la línea

    const text = lyricLine.substring(textStart, textEnd)

    blocks.push({
      chord: chords[i].chord,
      text: text || ' ', // Espacio mínimo para que el bloque tenga altura
    })
  }

  return { type: 'chords-lyrics', blocks }
}


/**
 * Función interna para líneas que solo contienen acordes
 */
function parseChordsOnly(line: string): SongBlock[] {
  const blocks: SongBlock[] = [];
  const chordRegex = /[^\s]+/g;
  let match;
  
  while ((match = chordRegex.exec(line)) !== null) {
    blocks.push({
      chord: match[0],
      text: ' '.repeat(match[0].length + 2) // Añadimos espacio visual entre acordes instrumentales
    });
  }
  
  return blocks;
}
