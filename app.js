const fileInput = document.querySelector("#fileInput");
const dropZone = document.querySelector("#dropZone");
const sourcePreview = document.querySelector("#sourcePreview");
const sourceEmpty = document.querySelector("#sourceEmpty");
const sourceMeta = document.querySelector("#sourceMeta");
const svgPreview = document.querySelector("#svgPreview");
const svgEmpty = document.querySelector("#svgEmpty");
const svgMeta = document.querySelector("#svgMeta");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");

let svgBlobUrl = "";
let svgMarkup = "";
let outputName = "converted-image.svg";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const escapeAttribute = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const resetOutputUrl = () => {
  if (svgBlobUrl) {
    URL.revokeObjectURL(svgBlobUrl);
    svgBlobUrl = "";
  }
};

const renderSvg = (file, dataUrl, width, height) => {
  const safeTitle = escapeAttribute(file.name.replace(/\.[^.]+$/, ""));
  svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${safeTitle}">
  <title>${safeTitle}</title>
  <image href="${dataUrl}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

  resetOutputUrl();
  svgBlobUrl = URL.createObjectURL(new Blob([svgMarkup], { type: "image/svg+xml" }));
  outputName = `${file.name.replace(/\.[^.]+$/, "") || "converted-image"}.svg`;

  svgPreview.classList.add("has-image");
  svgPreview.innerHTML = svgMarkup;
  svgPreview.append(svgEmpty);
  svgMeta.textContent = `${width} x ${height} SVG`;
  downloadButton.disabled = false;
  resetButton.disabled = false;
};

const showError = (message) => {
  dropZone.classList.add("error");
  sourceMeta.textContent = message;
  svgMeta.textContent = "Waiting for JPEG";
};

const convertFile = (file) => {
  if (!file || !/^image\/jpe?g$/i.test(file.type)) {
    showError("Please choose a JPEG file");
    return;
  }

  dropZone.classList.remove("error");

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const image = new Image();

    image.onload = () => {
      sourcePreview.src = dataUrl;
      sourcePreview.alt = file.name;
      sourcePreview.parentElement.classList.add("has-image");
      sourceMeta.textContent = `${image.naturalWidth} x ${image.naturalHeight}, ${formatBytes(file.size)}`;
      renderSvg(file, dataUrl, image.naturalWidth, image.naturalHeight);
    };

    image.onerror = () => showError("This JPEG could not be read");
    image.src = dataUrl;
  };

  reader.onerror = () => showError("This file could not be opened");
  reader.readAsDataURL(file);
};

fileInput.addEventListener("change", (event) => {
  convertFile(event.target.files[0]);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropZone.classList.remove("is-dragging");
  });
});

dropZone.addEventListener("drop", (event) => {
  convertFile(event.dataTransfer.files[0]);
});

downloadButton.addEventListener("click", () => {
  if (!svgMarkup) return;

  const link = document.createElement("a");
  link.href = svgBlobUrl;
  link.download = outputName;
  document.body.append(link);
  link.click();
  link.remove();
});

resetButton.addEventListener("click", () => {
  resetOutputUrl();
  svgMarkup = "";
  outputName = "converted-image.svg";
  fileInput.value = "";
  sourcePreview.removeAttribute("src");
  sourcePreview.removeAttribute("alt");
  sourcePreview.parentElement.classList.remove("has-image");
  svgPreview.classList.remove("has-image");
  svgPreview.innerHTML = "";
  svgPreview.append(svgEmpty);
  sourceMeta.textContent = "No file selected";
  svgMeta.textContent = "Waiting for image";
  downloadButton.disabled = true;
  resetButton.disabled = true;
});
