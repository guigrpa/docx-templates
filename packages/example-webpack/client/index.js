/* eslint-disable no-console */

import createReport from 'docx-templates';
import qrcode from 'yaqrcode';

console.log('Starting demo…');

// When DOM is ready, add listener
document.addEventListener('DOMContentLoaded', () => {
  const inputElement = document.getElementById('input');
  inputElement.addEventListener('change', onTemplateChosen, false);
});

// File chosen: build and save template!
async function onTemplateChosen() {
  console.log('Template chosen');

  // Read template
  const template = await readFileIntoArrayBuffer(this.files[0]);

  // Create report
  console.log('Creating report (can take some time) ...');
  const report = await createReport({
    template,
    data: async query => {
      const finalQuery = query || '{ viewer { login }}';
      const resp = await fetch('/github', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: finalQuery }),
      });
      const js = await resp.json();
      console.log(js);
      return js;
    },
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
      avatar: async url => {
        const resp = await fetch(url);
        const buffer = resp.arrayBuffer
          ? await resp.arrayBuffer()
          : await resp.buffer();
        return { width: 3, height: 3, data: buffer, extension: '.png' };
      },
      qr: contents => {
        const dataUrl = qrcode(contents, { size: 500 });
        const data = dataUrl.slice('data:image/gif;base64,'.length);
        return { width: 6, height: 6, data, extension: '.gif' };
      },
    },
  });

  // Save report
  saveDataToFile(
    report,
    'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}

// ==============================================
// Helpers
// ==============================================
const readFileIntoArrayBuffer = async fd =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(fd);
  });

const saveDataToFile = (data, fileName, mimeType) => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  downloadURL(url, fileName, mimeType);
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
};

const downloadURL = (data, fileName) => {
  const a = document.createElement('a');
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = 'display: none';
  a.click();
  a.remove();
};
