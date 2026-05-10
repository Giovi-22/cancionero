
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
 * Detecta si una línea es de metadatos (ej: "Intro:", "Tono: F#", etc.)
 */
export function isMetadataLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Match lines that start with a known label followed by a colon
  return /^(Intro|Solo|Outro|Puente|Bridge|Instrumental|Tono|BPM|Compás|NOTA|Note|Final|Interludio|Estrofa|Coro|Chorus|Verse|Acordes|Key|Tempo|Capo):/i.test(trimmed);
}

/**
 * Detecta si una línea de texto es probablemente una línea de acordes
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Regex estricto para acordes (soporta tensiones, bajos y paréntesis)
  const chordRegex = /^[A-G][b#]?(m|maj|min|dim|aug|sus|add|v|i|[0-9]|sus|add|dim|aug|maj|min)*\d*(?:[b#+-]\d+)?(?:\([^)]+\))?(?:\/[A-G][b#]?)?$/i;
  
  // Si la línea es de metadatos, NO la tratamos como una línea de acordes estándar
  // para evitar que se pinte con colores de acordes y se mueva de lugar.
  if (isMetadataLine(trimmed)) return false;

  // Limpiar etiquetas al principio para el conteo
  const cleanTrimmed = trimmed.replace(/^(Intro|Solo|Outro|Puente|Bridge|Instrumental|Tono|BPM|Compás|NOTA|Note|Final|Interludio|Estrofa|Coro|Chorus|Verse|Acordes|Key|Tempo|Capo):\s*/i, '');
  if (!cleanTrimmed) return false;
  
  const tokens = cleanTrimmed.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  for (const token of tokens) {
    // Si el token es un acorde o un símbolo de repetición/duración común
    if (chordRegex.test(token) || /^[:|/\\-]{1,4}$/.test(token)) {
      chordCount++;
    }
  }

  // Si la mayoría de los tokens son acordes, es una línea de acordes
  return chordCount / tokens.length >= 0.5;
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

    // Caso 0: El título es siempre la primera línea no vacía (si no es acorde/sección)
    if (i === 0 && currentLine.trim() !== '' && !isChordLine(currentLine) && !currentLine.trim().startsWith('[')) {
      result.push({
        type: 'section',
        blocks: [{ text: `[TITULO] ${currentLine.trim()}` }]
      });
      continue;
    }

    // Caso A: Línea de acordes seguida de letra
    // Solo si la siguiente línea NO es metadatos o vacío
    if (isChordLine(currentLine) && nextLine !== undefined && !isChordLine(nextLine) && nextLine.trim() !== '' && !isMetadataLine(nextLine)) {
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
   */
  function snapToWordStart(pos: number, text: string): number {
    if (pos <= 0) return 0
    if (pos >= text.length) return text.length
    if (text[pos] === ' ') return pos;
    if (pos > 0 && text[pos-1] === ' ') return pos
    
    let i = pos
    while (i > 0 && text[i-1] !== ' ') i--
    return i
  }

  // 2. Agrupamos acordes que caen en el mismo punto de la letra (misma palabra)
  // Esto evita tener que crear bloques vacíos que generan huecos en el texto.
  const groups: Map<number, { chord: string; index: number }[]> = new Map();
  const cutPointsSet: Set<number> = new Set();

  for (const c of chords) {
    const cp = snapToWordStart(c.index, lyricLine);
    if (!groups.has(cp)) groups.set(cp, []);
    groups.get(cp)!.push(c);
    cutPointsSet.add(cp);
  }

  const sortedCutPoints = Array.from(cutPointsSet).sort((a, b) => a - b);

  // 3. Texto inicial antes del primer grupo
  if (sortedCutPoints[0] > 0) {
    blocks.push({ text: lyricLine.substring(0, sortedCutPoints[0]) });
  }

  // 4. Creamos los bloques agrupados
  for (let i = 0; i < sortedCutPoints.length; i++) {
    const start = sortedCutPoints[i];
    const end = i + 1 < sortedCutPoints.length ? sortedCutPoints[i + 1] : lyricLine.length;
    
    const chordsInGroup = groups.get(start)!;
    
    // Construimos un único string de acordes manteniendo el espaciado relativo original
    let combinedChord = "";
    let lastChordEnd = chordsInGroup[0].index;
    combinedChord += chordsInGroup[0].chord;
    lastChordEnd = chordsInGroup[0].index + chordsInGroup[0].chord.length;

    for (let j = 1; j < chordsInGroup.length; j++) {
      const c = chordsInGroup[j];
      const gap = Math.max(1, c.index - lastChordEnd);
      combinedChord += " ".repeat(gap) + c.chord;
      lastChordEnd = c.index + c.chord.length;
    }

    blocks.push({
      chord: combinedChord,
      text: lyricLine.substring(start, end)
    });
  }

  return { type: 'chords-lyrics', blocks }
}


/**
 * Función interna para líneas que solo contienen acordes
 */
function parseChordsOnly(line: string): SongBlock[] {
  const blocks: SongBlock[] = [];
  
  // Detectar si la línea empieza con una etiqueta (ej: "Intro: ")
  const labelMatch = line.match(/^(Intro|Solo|Outro|Puente|Bridge|Instrumental|Tono|BPM|Compás|NOTA|Note|Final|Interludio|Estrofa|Coro|Chorus|Verse):\s*/i);
  let processLine = line;
  let offset = 0;
  
  if (labelMatch) {
    blocks.push({
      text: labelMatch[0]
    });
    processLine = line.substring(labelMatch[0].length);
    offset = labelMatch[0].length;
  }

  const chordRegex = /[^\s]+/g;
  let match;
  const chords: { chord: string; index: number }[] = [];
  
  while ((match = chordRegex.exec(processLine)) !== null) {
    chords.push({ chord: match[0], index: match.index });
  }

  for (let i = 0; i < chords.length; i++) {
    const current = chords[i];
    const next = chords[i + 1];
    
    // Calculamos el espacio hasta el siguiente acorde
    let spaceCount = 3; // Espacio por defecto al final
    if (next) {
      // Intentamos preservar la distancia original, pero con un mínimo de 3 espacios
      spaceCount = Math.max(3, next.index - (current.index + current.chord.length));
    }

    blocks.push({
      chord: current.chord,
      text: ' '.repeat(spaceCount)
    });
  }
  
  return blocks;
}
