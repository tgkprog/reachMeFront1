/**
 * Utility Functions
 */

/**
 * Generate random alphanumeric code
 * Rules:
 * - All lowercase (better usability on mobile, no shift key needed)
 * - First char: consonants + numbers (no vowels)
 * - Middle chars: consonants + numbers + hyphen (but after hyphen, no more hyphens)
 * - Last char: consonants + numbers + ! (no vowels)
 * - Examples: "ghj", "k-!", "ki!", "m-u", "m-7", "5-8", "4-!"
 */
function generateRandomCode(length = 5) {
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const numbers = "0123456789";

  // Character sets for each position
  const firstChars = consonants + numbers; // No vowels, no hyphen
  const middleChars = consonants + numbers + "-"; // Includes hyphen
  const lastChars = consonants + numbers + "!"; // Includes !, no vowels

  if (length < 2) {
    // For single char codes, just use first char set
    return firstChars.charAt(Math.floor(Math.random() * firstChars.length));
  }

  let code = "";
  let hyphenUsed = false;

  // First character: consonant or number only
  code += firstChars.charAt(Math.floor(Math.random() * firstChars.length));

  // Middle characters (positions 1 to length-2)
  for (let i = 1; i < length - 1; i++) {
    if (hyphenUsed) {
      // After hyphen, use only first char set (no more hyphens)
      code += firstChars.charAt(Math.floor(Math.random() * firstChars.length));
    } else {
      // Can still get hyphen
      const char = middleChars.charAt(
        Math.floor(Math.random() * middleChars.length)
      );
      code += char;
      if (char === "-") {
        hyphenUsed = true;
      }
    }
  }

  // Last character: consonant, number, or !
  code += lastChars.charAt(Math.floor(Math.random() * lastChars.length));

  return code;
}

/**
 * Check if code exists in database
 */
async function isCodeUnique(code, db) {
  const [rows] = await db.query(
    "SELECT id FROM pblcRechms WHERE url_code = ?",
    [code]
  );
  return rows.length === 0;
}

/**
 * Generate unique code with progressive collision handling
 * Starts with 3 chars, progressively increases to 7 chars based on collisions
 */
async function generateUniqueCode(db, initialLength = 3) {
  const collisionLimits = [
    { length: 3, maxAttempts: 50 },
    { length: 4, maxAttempts: 200 },
    { length: 5, maxAttempts: 200 },
    { length: 6, maxAttempts: 200 },
    { length: 7, maxAttempts: 200 },
  ];

  for (const { length, maxAttempts } of collisionLimits) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const code = generateRandomCode(length);
      const isUnique = await isCodeUnique(code, db);

      if (isUnique) {
        console.log(
          `✅ Generated unique code: ${code} (length: ${length}, attempts: ${
            attempts + 1
          })`
        );
        return code;
      }

      attempts++;
    }

    console.warn(
      `⚠️  ${maxAttempts} collisions at length ${length}, trying ${
        length + 1
      } chars...`
    );
  }

  throw new Error(
    "Failed to generate unique code after maximum attempts with all lengths"
  );
}

/**
 * Format date-time for display
 */
function formatDateTime(date) {
  return new Date(date).toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Validate deactivation time
 * Must be at least 30 minutes from now if not null
 */
function validateDeactivateTime(newDeactivateAt, currentDeactivateAt) {
  if (!newDeactivateAt) {
    return { valid: true };
  }

  const newDate = new Date(newDeactivateAt);
  const now = new Date();
  const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now

  if (newDate < minTime) {
    return {
      valid: false,
      error: "Deactivation time must be at least 30 minutes in the future",
    };
  }

  // If there's a current deactivate time, new time must be later
  if (currentDeactivateAt) {
    const currentDate = new Date(currentDeactivateAt);
    if (newDate < currentDate) {
      return {
        valid: false,
        error:
          "New deactivation time must be later than current deactivation time",
      };
    }
  }

  return { valid: true };
}

module.exports = {
  generateRandomCode,
  generateUniqueCode,
  formatDateTime,
  validateDeactivateTime,
  isCodeUnique,
};
