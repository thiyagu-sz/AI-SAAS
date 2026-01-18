const isValidContent = (text) => {
  if (!text || text.trim().length < 10) return false;
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  if (words.length < 2) return false;
  
  const hasRepeatingChars = /(.)\1{4,}/.test(text);
  const hasVowels = /[aeiou]/i.test(text);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const wordsWithLetters = words.filter(w => (w.match(/[a-z]/gi) || []).length >= 3).length;
  
  const result = !hasRepeatingChars && hasVowels && avgWordLength < 20 && wordsWithLetters >= 2;
  
  console.log('Text:', text);
  console.log('Words:', words.length, 'Words with 3+ letters:', wordsWithLetters);
  console.log('Avg word length:', avgWordLength.toFixed(2));
  console.log('Result:', result);
  console.log('---');
  return result;
};

// Test with common study materials
isValidContent('Photosynthesis is the process by which plants convert light energy into chemical energy');
isValidContent('Python, Java, and C++ are popular programming languages');
isValidContent('COVID-19 is a highly contagious virus');
isValidContent('Test this is valid content here');
isValidContent('The quick brown fox jumps over the lazy dog');

// Test with gibberish
isValidContent('dfhbzfdhsnfghjfgjstr');
isValidContent('aaaaaaaaa bbbbbbbbb cccccccc');
isValidContent('no');
isValidContent('xy');
