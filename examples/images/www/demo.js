/* eslint-disable no-console */

console.log('Starting images demo');

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
    additionalJsContext: {
      tile: async (z, x, y) => {
        const resp = await fetch(
          `http://tile.stamen.com/toner/${z}/${x}/${y}.png`
        );
        const buffer = resp.arrayBuffer
          ? await resp.arrayBuffer()
          : await resp.buffer();
        return { width: 3, height: 3, data: buffer, extension: '.png' };
      },
      chart: arr => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        for (let i = 0; i < arr.length; i++) {
          ctx.strokeStyle = 'black';
          ctx.strokeRect(0, 10 * i, arr[i], 10);
        }
        const data = canvas.toDataURL().slice('data:image/png;base64,'.length);
        return { width: 3, height: 3, data, extension: '.png' };
      },
    },
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
