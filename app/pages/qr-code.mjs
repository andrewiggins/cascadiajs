export default function ({ html }) {
  return html`
    <main-layout>
      <simple-page title="QR Code Generator" width="narrow">
        <style>
          .qr-tool {
            display: grid;
            gap: 24px;
          }

          .qr-controls {
            display: grid;
            gap: 16px;
          }

          .qr-field {
            display: grid;
            gap: 6px;
          }

          .qr-field label {
            color: #112378;
            font-family: freight-macro-pro, serif;
            font-size: 20px;
            font-weight: 500;
          }

          .qr-field input {
            box-sizing: border-box;
            width: 100%;
            border: 2px solid #112378;
            background: #fff;
            color: #020800;
            font: inherit;
          }

          .qr-field input[type="url"] {
            min-height: 44px;
            padding: 8px 10px;
          }

          .qr-field input[type="color"] {
            width: 96px;
            height: 44px;
            padding: 4px;
          }

          .qr-output {
            display: grid;
            gap: 16px;
            justify-items: center;
          }

          .qr-canvas-wrap {
            box-sizing: border-box;
            width: min(100%, 420px);
            aspect-ratio: 1;
            border: 2px solid #112378;
            background: #fff;
            padding: 16px;
          }

          #qr-canvas {
            display: block;
            width: 100%;
            height: 100%;
          }

          .qr-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
          }

          .qr-actions button {
            border: 4px solid #0033ff;
            background: #0033ff;
            color: #fff5cc;
            cursor: pointer;
            font-family: mono45-headline, sans-serif;
            font-size: 18px;
            font-weight: 500;
            padding: 8px 12px;
          }

          .qr-actions button:hover {
            border-color: #112378;
            background: #112378;
          }

          .qr-actions button:disabled {
            border-color: #666;
            background: #ccc;
            color: #020800;
            cursor: not-allowed;
          }

          .qr-status {
            min-height: 1.5em;
            text-align: center;
          }

          @media only screen and (min-width: 768px) {
            .qr-controls {
              grid-template-columns: 1fr auto;
              align-items: end;
            }
          }
        </style>

        <div class="qr-tool">
          <div class="qr-controls">
            <div class="qr-field">
              <label for="qr-url">URL</label>
              <input
                id="qr-url"
                type="url"
                value="https://cascadiajs.com/"
                required
              />
            </div>
            <div class="qr-field">
              <label for="qr-color">QR Color</label>
              <input id="qr-color" type="color" value="#112378" />
            </div>
          </div>

          <div class="qr-output">
            <div class="qr-canvas-wrap">
              <canvas
                id="qr-canvas"
                width="768"
                height="768"
                aria-label="Generated QR code"
              ></canvas>
            </div>
            <div class="qr-actions">
              <button id="qr-download" type="button">Download PNG</button>
              <button id="qr-copy" type="button">Copy to clipboard</button>
            </div>
            <p id="qr-status" class="qr-status" role="status"></p>
          </div>
        </div>

        <script type="module">
          import { toCanvas } from "https://esm.sh/qrcode@1.5.4";

          const qrUrlInput = document.querySelector("#qr-url");
          const qrColorInput = document.querySelector("#qr-color");
          const qrCanvas = document.querySelector("#qr-canvas");
          const qrDownloadButton = document.querySelector("#qr-download");
          const qrCopyButton = document.querySelector("#qr-copy");
          const qrStatus = document.querySelector("#qr-status");
          const qrContext = qrCanvas.getContext("2d");
          const logoPath = "/_public/images/icon.svg";
          let logoSvgText;
          let renderId = 0;

          async function getLogoSvgText() {
            if (logoSvgText) return logoSvgText;
            const response = await fetch(logoPath);
            if (!response.ok) {
              throw new Error("Logo could not be loaded.");
            }
            logoSvgText = await response.text();
            return logoSvgText;
          }

          function setStatus(message, type = "") {
            qrStatus.textContent = message;
            qrStatus.className = type ? \`qr-status highlight \${type}\` : "qr-status";
          }

          function validateUrl() {
            const value = qrUrlInput.value.trim();
            if (!value) return null;

            try {
              return new URL(value).href;
            } catch {
              return null;
            }
          }

          function loadImage(src) {
            return new Promise((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve(image);
              image.onerror = reject;
              image.src = src;
            });
          }

          async function drawLogo(color) {
            const svgText = await getLogoSvgText();
            const coloredSvg = svgText
              .replaceAll('fill="#fff"', \`fill="\${color}"\`)
              .replaceAll("fill='#fff'", \`fill="\${color}"\`);
            const blob = new Blob([coloredSvg], {
              type: "image/svg+xml;charset=utf-8",
            });
            const objectUrl = URL.createObjectURL(blob);

            try {
              const logo = await loadImage(objectUrl);
              const logoSize = Math.round(qrCanvas.width * 0.2);
              const padding = Math.round(logoSize * 0.18);
              const backingSize = logoSize + padding * 2;
              const backingX = Math.round((qrCanvas.width - backingSize) / 2);
              const backingY = Math.round((qrCanvas.height - backingSize) / 2);
              const logoX = Math.round((qrCanvas.width - logoSize) / 2);
              const logoY = Math.round((qrCanvas.height - logoSize) / 2);

              qrContext.fillStyle = "#ffffff";
              qrContext.fillRect(backingX, backingY, backingSize, backingSize);
              qrContext.drawImage(logo, logoX, logoY, logoSize, logoSize);
            } finally {
              URL.revokeObjectURL(objectUrl);
            }
          }

          async function renderQr() {
            const url = validateUrl();
            const color = qrColorInput.value;
            const currentRenderId = ++renderId;

            qrDownloadButton.disabled = true;
            qrCopyButton.disabled = true;

            if (!url) {
              qrContext.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
              setStatus("Enter a full URL, including https://.", "error");
              return;
            }

            try {
              await toCanvas(qrCanvas, url, {
                errorCorrectionLevel: "H",
                margin: 2,
                scale: 16,
                width: qrCanvas.width,
                color: {
                  dark: color,
                  light: "#ffffff",
                },
              });
              qrCanvas.style.width = "100%";
              qrCanvas.style.height = "100%";

              await drawLogo(color);

              if (currentRenderId !== renderId) return;

              qrDownloadButton.disabled = false;
              qrCopyButton.disabled = false;
              setStatus("");
            } catch (error) {
              console.error(error);
              setStatus("QR code could not be generated.", "error");
            }
          }

          function getCanvasBlob() {
            return new Promise((resolve, reject) => {
              qrCanvas.toBlob((blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error("QR code image could not be created."));
                }
              }, "image/png");
            });
          }

          qrUrlInput.addEventListener("input", renderQr);
          qrColorInput.addEventListener("input", renderQr);

          qrDownloadButton.addEventListener("click", async () => {
            const blob = await getCanvasBlob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "cascadiajs-qr-code.png";
            link.click();
            URL.revokeObjectURL(link.href);
          });

          qrCopyButton.addEventListener("click", async () => {
            if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
              setStatus("Image clipboard copying is not supported in this browser.", "warning");
              return;
            }

            try {
              const blob = await getCanvasBlob();
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              setStatus("Copied QR code image to clipboard.", "success");
            } catch (error) {
              console.error(error);
              setStatus("QR code image could not be copied.", "error");
            }
          });

          renderQr();
        </script>
      </simple-page>
    </main-layout>
  `;
}
