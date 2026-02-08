/**
 * clean-text.js
 * Backend module to perform mechanical cleanup on extracted biodata text.
 * Removes noise, emojis, and irrelevant chatter without parsing fields.
 */

/**
 * Main function to clean extracted text.
 * @param {string} extractedText - The raw text extracted from a file or input.
 * @returns {Promise<{success: boolean, cleanedText: string}>}
 */
async function cleanExtractedText(extractedText) {
  try {
    if (!extractedText || typeof extractedText !== 'string') {
      return {
        success: true,
        cleanedText: ""
      };
    }

    let text = extractedText;

    // 1. Remove WhatsApp specific noise (timestamps, headers)
    text = removeWhatsAppNoise(text);

    // 2. Remove emojis and non-text symbols
    text = stripEmojis(text);

    // 3. Remove conversational chatter
    text = removeChatter(text);

    // 4. Normalize whitespace (final pass)
    text = normalizeWhitespace(text);

    return {
      success: true,
      cleanedText: text
    };

  } catch (error) {
    console.error("Text cleaning failed:", error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// ------------------------------------------------------------------
// Helper Functions
// ------------------------------------------------------------------

function removeWhatsAppNoise(text) {
  // Remove "Forwarded" headers
  text = text.replace(/Forwarded message/gi, "");
  text = text.replace(/Forwarded/gi, "");

  // Remove "Sent from..." footers
  text = text.replace(/Sent from my iPhone/gi, "");
  text = text.replace(/Sent from my Android/gi, "");
  text = text.replace(/Sent from my Samsung/gi, "");
  text = text.replace(/Get Outlook for iOS/gi, "");
  text = text.replace(/Get Outlook for Android/gi, "");

  // Remove standard WhatsApp timestamps at start of lines
  // e.g. [12/05/21, 10:30:00 AM] Name: Message
  // e.g. 12/05/21, 10:30 AM - Name: Message
  const timestampRegex = /^\[?\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4},? \d{1,2}:\d{2}(?::\d{2})? ?(?:AM|PM|am|pm)?\]? -? ?/gm;
  text = text.replace(timestampRegex, "");

  return text;
}

function stripEmojis(text) {
  // Regex to match emoji ranges (Unicode blocks for emojis and symbols)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  return text.replace(emojiRegex, "");
}

function removeChatter(text) {
  const chatterPhrases = [
    "Hi please see attached",
    "Please find attached",
    "PFA",
    "This is my cousin's profile",
    "This is my son's profile",
    "This is my daughter's profile",
    "Let me know if you need more info",
    "Let me know if you need anything else",
    "Hope you are doing well",
    "Please check",
    "Kindly check",
    "Attached is the biodata",
    "Here is the biodata"
  ];

  // Remove these phrases case-insensitively
  chatterPhrases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    text = text.replace(regex, "");
  });

  return text;
}

function normalizeWhitespace(text) {
  // Replace multiple spaces/tabs with a single space
  text = text.replace(/[ \t]+/g, " ");

  // Replace 3 or more newlines with 2 newlines (paragraph break)
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim leading/trailing whitespace from each line
  text = text.split('\n').map(line => line.trim()).join('\n');

  // Final trim
  return text.trim();
}

module.exports = {
  cleanExtractedText
};
