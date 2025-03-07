/**
 * redacted timestamps from a segment
 * Tthis has better accuracy than the previous approaches
 */
export function generateRedactedTimestamps(segment) {
    if (!segment.redaction || !segment.transcription || !segment.words || segment.words.length === 0) {
      return [];
    }
  
    // Find all redaction placeholders in the redacted text
    const regex = /<[^>]+>/g;
    const redactedMatches = segment.redaction.match(regex) || [];
    
    if (redactedMatches.length === 0) {
      return [];
    }
    
    console.log("Segment analysis:", {
      redactedText: segment.redaction,
      originalText: segment.transcription,
      redactedMatches,
      wordCount: segment.words.length
    });
    
    // Find redacted words by comparing original and redacted texts
    const redactedWords = [];
    
    // Arrays of words
    const redactedTextWords = segment.redaction.split(/\s+/);
    const originalTextWords = segment.transcription.split(/\s+/);
    
    // Identify redacted words by placeholders
    redactedTextWords.forEach((word, index) => {
      if (redactedMatches.some(placeholder => word.includes(placeholder))) {
        redactedWords.push({
          index,
          text: word
        });
      }
    });
    
    console.log("Redacted words identified:", redactedWords);
    
    // Map redacted words to timestamps
    const timestamps = [];
    
    if (redactedWords.length > 0) {
      redactedWords.forEach(redactedWord => {
        // Find the corresponding words in the original text and the speech timestamps
        const originalWordIndex = redactedWord.index;
        
        // Get a range of words to check, allowing for slight mismatches in word count
        const startIndex = Math.max(0, originalWordIndex - 1);
        const endIndex = Math.min(segment.words.length - 1, originalWordIndex + 1);
        
        // Use the longest span of available timestamps
        let startTime = null;
        let endTime = null;
        
        // Find earliest valid start time
        for (let i = startIndex; i >= 0; i--) {
          if (segment.words[i] && segment.words[i].start !== undefined) {
            startTime = segment.words[i].start * 1000 + segment.start - 300; // buffer
            break;
          }
        }
        
        // Find latest valid end time
        for (let i = endIndex; i < segment.words.length; i++) {
          if (segment.words[i] && segment.words[i].end !== undefined) {
            endTime = segment.words[i].end * 1000 + segment.start + 300;
            break;
          }
        }
        
        // Fallback: just use the segment boundaries
        if (startTime === null) startTime = segment.start;
        if (endTime === null) endTime = segment.end;
        
        // Add timestamp with diagnostic info
        timestamps.push({
          text: redactedWord.text,
          start: startTime,
          end: endTime,
          wordIndex: redactedWord.index
        });
      });
    } else {
      // Fallback for when we can't find exact matches
      console.log("Fallback redaction detection: using regex to find placeholders in text");
      
      // Try to find placeholders directly in the segment text
      let match;
      let startPos = 0;
      const redactedText = segment.redaction;
      
      while ((match = regex.exec(redactedText)) !== null) {
        const matchIndex = match.index;
        const matchLength = match[0].length;
        
        // Count words up to the match
        const textBeforeMatch = redactedText.substring(0, matchIndex);
        const wordCount = textBeforeMatch.split(/\s+/).length - 1;
        
        // Use the word index to find timestamps
        if (wordCount >= 0 && wordCount < segment.words.length) {
          const word = segment.words[wordCount];
          if (word && word.start !== undefined && word.end !== undefined) {
            timestamps.push({
              text: match[0],
              start: word.start * 1000 + segment.start - 200,
              end: word.end * 1000 + segment.start + 200,
              wordIndex: wordCount
            });
          }
        }
      }
    }
    
    console.log("Final redacted timestamps for segment:", timestamps);
    return timestamps;
  }
  
  /**
   * Process all segments in a call to get redacted timestamps
   */
  export function processCallForRedaction(call) {
    if (!call || !call.segments || !Array.isArray(call.segments)) {
      return [];
    }
    
    let allTimestamps = [];
    
    call.segments.forEach(segment => {
      const segmentTimestamps = generateRedactedTimestamps(segment);
      allTimestamps = [...allTimestamps, ...segmentTimestamps];
    });
    
    return allTimestamps;
  }