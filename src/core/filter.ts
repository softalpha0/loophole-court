/**
 * Silly readings must be obviously absurd and harmless. Anything that looks
 * like real cheating advice is dropped here, in code, on top of the prompt rules.
 */
const CHEATING = [
  /\bchat\s?gpt\b/i,
  /\b(ai|a\.i\.|chatbot|bot|llm|gpt|claude|gemini)\b[^.]{0,40}\b(write|writes|wrote|written|do|does|did|generate|make|finish)/i,
  /\b(write|do|generate|finish)[^.]{0,30}\bwith (an? )?(ai|chatbot|bot)\b/i,
  /\bai[- ](written|generated|tool|writer)/i,
  /\bcop(y|ies|ied|ying)\b/i,
  /\bpaste\b/i,
  /\bplagiar/i,
  /\bbuy(ing|s)?\b|\bbought\b|\bpay(ing|s)? (someone|somebody|a friend|my|an?)\b|\bpaid (someone|somebody)\b/i,
  /\bessay (mill|service|writer)s?\b|\bghost-?writ/i,
  /\b(fake|made[- ]up|invent(ed)?|fabricat\w*|non-?existent)\s+(source|citation|reference|quote|stat|data|bibliograph)/i,
  /\b(someone|somebody|anyone|my (\w+ )?(brother|sister|mum|mom|dad|friend|parent|cousin|tutor|uncle|aunt)|a friend|another student|older student)\b[^.]{0,30}\b(write|writes|do|does|did|finish)\b/i,
  /\bget \w+( \w+)? to (write|do|finish)\b/i,
  /\bcheat/i,
  /\bspin(ner)?\b|\breword(ing|er)? tool|\bparaphras(e|ing) tool/i,
  /\bturnitin\b|\bdetector\b/i,
];

export function isHarmless(text: string): boolean {
  return !CHEATING.some((re) => re.test(text));
}
