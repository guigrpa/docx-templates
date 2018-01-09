console.log("Starting swapi demo")

const createReport = docxTemplates;

// callback when a template has been selected
async function onTemplateChosen() {
  console.log("Template chosen");
  // read the file in an ArrayBuffer
  let content = await readFile(this.files[0]);
  // fill the template
  console.log("Creating report (can take some time) ...");
  let doc = await createReport({
    template: content,
    data: query => postQuery("/swapi", query) // query to swapi webservice
  });
  // generate output file for download
  downloadBlob(doc, 'report.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
};

//==============================================
//                 Helpers
//==============================================

// add an event listener on file-input change
// (need to wait for DOM to be loaded otherwise input will be undefined)
document.addEventListener("DOMContentLoaded", () => {
  var inputElement = document.getElementById("input");
  inputElement.addEventListener("change", onTemplateChosen, false);
});

// send query to swapi: we need to forward query to server to
// avoid browser's Cross-Site Requests blocker
async function postQuery(url, query) {
  return new Promise((resolve, reject) => {
    // Sending and receiving data in JSON format using POST method
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var json = JSON.parse(xhr.responseText);
        resolve(json);
      }
    };
    var data = JSON.stringify({query});
    xhr.send(data);
  });
};

// read given file into an ArrayBuffer
async function readFile(fd) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = async e => {
            let buff = reader.result;
            resolve(buff);
        }
        // read the file, and wait for 'onload' to be called
        reader.readAsArrayBuffer(fd)
    })
};

// helper to download data as a file (like saveAs)
function downloadURL(data, fileName) {
  var a;
  a = document.createElement('a');
  a.href = data;
  a.download = fileName;
  document.body.appendChild(a);
  a.style = 'display: none';
  a.click();
  a.remove();
};
function downloadBlob(data, fileName, mimeType) {
  var blob, url;
  blob = new Blob([data], {
    type: mimeType
  });
  url = window.URL.createObjectURL(blob);
  downloadURL(url, fileName, mimeType);
  setTimeout(function() {
    return window.URL.revokeObjectURL(url);
  }, 1000);
};
