/**
 * Browser-compatible OFX parser using DOMParser.
 * Avoids ofx-js/xml2js which rely on Node's EventEmitter (removeAllListeners) and break in the browser.
 */

export type ParsedOfxTransaction = {
  date: string;
  amount: number;
  description: string;
  isCredit: boolean;
};

function formatOfxDate(dt: string): string {
  const s = String(dt || '').replace(/[^0-9]/g, '').slice(0, 8);
  if (s.length >= 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return new Date().toISOString().slice(0, 10);
}

/** Convert OFX 1.x SGML-style (no closing tags) to XML so DOMParser can read it. */
function sgml2Xml(sgml: string): string {
  return sgml
    .replace(/>\s+</g, '><')
    .replace(/\s+</g, '<')
    .replace(/>\s+/g, '>')
    .replace(/<([A-Za-z0-9_]+)>([^<]+)<\/\1>/g, '<$1>$2')
    .replace(/<([A-Z0-9_]*)+\.+([A-Z0-9_]*)>([^<]+)/g, '<$1$2>$3')
    .replace(/<(\w+?)>([^<]+)/g, '<$1>$2</$1>');
}

function parseOfxXml(xmlString: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'text/xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error('Invalid or unsupported OFX structure.');
  return doc;
}

export async function parseOfx(ofxString: string): Promise<ParsedOfxTransaction[]> {
  const parts = ofxString.split('<OFX>', 2);
  if (parts.length < 2) {
    throw new Error('Invalid OFX file or unsupported format (use bank statement).');
  }
  const content = '<OFX>' + parts[1];

  let doc: Document;
  try {
    doc = parseOfxXml(content);
  } catch {
    doc = parseOfxXml(sgml2Xml(content));
  }

  const stmtTrnList = doc.getElementsByTagName('STMTTRN');
  if (!stmtTrnList || stmtTrnList.length === 0) {
    throw new Error('Invalid OFX file or unsupported format (use bank statement).');
  }

  const out: ParsedOfxTransaction[] = [];

  for (let i = 0; i < stmtTrnList.length; i++) {
    const trn = stmtTrnList[i];
    const trnamtEl = trn.getElementsByTagName('TRNAMT')[0];
    const rawAmt = trnamtEl?.textContent?.trim() ?? '0';
    const amount = parseFloat(rawAmt);
    if (isNaN(amount) || amount === 0) continue;

    const dtEl = trn.getElementsByTagName('DTPOSTED')[0];
    const date = formatOfxDate(dtEl?.textContent?.trim() ?? '');
    const memo = trn.getElementsByTagName('MEMO')[0]?.textContent?.trim();
    const name = trn.getElementsByTagName('NAME')[0]?.textContent?.trim();
    const description = memo || name || 'OFX import';

    out.push({
      date,
      amount: Math.abs(amount),
      description,
      isCredit: amount > 0,
    });
  }

  return out;
}
