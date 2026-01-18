const isValidContent = (text) => {
  const words = text.toLowerCase().split(/\s+/);
  const hasRepeatingChars = /(.)\1{4,}/.test(text);
  const hasVowels = /[aeiou]/i.test(text);
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const commonWords = words.filter(w => /^[a-z]{3,}$/i.test(w)).length;
  const result = !hasRepeatingChars && hasVowels && avgWordLength < 20 && commonWords > 0;
  
  console.log('Text:', text);
  console.log('Words:', words.length, 'Common words:', commonWords);
  console.log('Avg word length:', avgWordLength.toFixed(2));
  console.log('Result:', result);
  console.log('---');
  return result;
};

isValidContent('Photosynthesis is the process by which plants convert light energy into chemical energy');
isValidContent('Python, Java, and C++ are popular programming languages');
isValidContent('COVID-19 is a highly contagious virus');
isValidContent('Test this is valid content here');
isValidContent('The quick brown fox jumps over the lazy dog');
