/* eslint-disable no-console */

console.log('Starting swapi demo');

const createReport = docxTemplates; // eslint-disable-line

// callback when a template has been selected
async function onTemplateChosen() {
  console.log('Template chosen');
  // read the file in an ArrayBuffer
  const content = await readFile(this.files[0]);
  // fill the template
  console.log('Creating report (can take some time) ...');
  const doc = await createReport({
    template: content,
    data: query => postQuery('/swapi', query), // query to swapi webservice
  });
  // generate output file for download
  downloadBlob(
    doc,
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

// ==============================================
//                 Helpers
// ==============================================

// add an event listener on file-input change
// (need to wait for DOM to be loaded otherwise input will be undefined)
document.addEventListener('DOMContentLoaded', () => {
  const inputElement = document.getElementById('input');
  inputElement.addEventListener('change', onTemplateChosen, false);
});

// send query to swapi: we need to forward query to server to
// avoid browser's Cross-Site Requests blocker
async function postQuery(url, query) {
  return new Promise(resolve => {
    // Sending and receiving data in JSON format using POST method
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const json = JSON.parse(xhr.responseText);
        resolve(json);
      }
    };
    const data = JSON.stringify({ query });
    xhr.send(data);
  });
}

// read given file into an ArrayBuffer
async function readFile(fd) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(fd);
  });
}

// helper to download data as a file (like saveAs)
function downloadURL(data, fileName) {
  const a = document.createElement('a');
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = 'display: none';
  a.click();
  a.remove();
}

function downloadBlob(data, fileName, mimeType) {
  const blob = new Blob([data], {
    type: mimeType,
  });
  const url = window.URL.createObjectURL(blob);
  downloadURL(url, fileName, mimeType);
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}
