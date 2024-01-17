import docxToString from './docxToString';

const getVariables = async (format) => {
  const paragraphs = await docxToString(format);
  console.log('text extracted: ', paragraphs);
  let variables = [];

  // extract variables in format {text}
  let regex = /\{([^}]+)\}/g;
  for (let paragraph of paragraphs) {
    let match = regex.exec(paragraph);
    if (match !== null) {
      variables.push(match[1]);
    }
  }
  console.log('variables extracted: ', variables);
  let variablesStr = '';
  for (let variable of variables) {
    variablesStr += `- ${variable} \n`;
  }
  console.log(variablesStr);
  return [variables, variablesStr];
};

module.exports = getVariables;
