const PizZip = require('pizzip');
const { DOMParser } = require('@xmldom/xmldom');

function str2xml(str) {
  if (str.charCodeAt(0) === 65279) {
    // BOM sequence
    str = str.substr(1);
  }
  return new DOMParser().parseFromString(str, 'text/xml');
}

async function getParagraphs(file) {
  // convert file to binary content in variable 'content'
  const content = await file.arrayBuffer();
  console.log(content);
  // convert 'content' to text
  const zip = new PizZip(content);
  const xml = str2xml(zip.files['word/document.xml'].asText());
  const paragraphsXml = xml.getElementsByTagName('w:p');
  const paragraphs = [];

  for (let i = 0, len = paragraphsXml.length; i < len; i++) {
    let fullText = '';
    const textsXml = paragraphsXml[i].getElementsByTagName('w:t');
    for (let j = 0, len2 = textsXml.length; j < len2; j++) {
      const textXml = textsXml[j];
      if (textXml.childNodes) {
        fullText += textXml.childNodes[0].nodeValue;
      }
    }

    paragraphs.push(fullText);
  }
  return paragraphs;
}

module.exports = getParagraphs;
