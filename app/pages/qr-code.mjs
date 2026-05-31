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

          .qr-field input,
          .qr-field select {
            box-sizing: border-box;
            width: 100%;
            border: 2px solid #112378;
            background: #fff;
            color: #020800;
            font: inherit;
          }

          .qr-field input[type="url"],
          .qr-field select {
            min-height: 44px;
            padding: 8px 10px;
          }

          .qr-field input[type="color"] {
            width: 96px;
            height: 44px;
            padding: 4px;
          }

          .qr-field-custom[hidden] {
            display: none;
          }

          .qr-checkbox {
            align-items: center;
            display: flex;
            gap: 10px;
          }

          .qr-checkbox input {
            flex: 0 0 auto;
            width: 22px;
            height: 22px;
          }

          .qr-checkbox label {
            color: #112378;
            font-family: freight-macro-pro, serif;
            font-size: 20px;
            font-weight: 500;
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

          #qr-code {
            align-items: center;
            display: flex;
            height: 100%;
            justify-content: center;
            width: 100%;
          }

          #qr-code canvas,
          #qr-code svg {
            display: block;
            height: 100%;
            width: 100%;
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
              grid-template-columns: 1fr auto auto;
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
              <label for="qr-color-preset">QR Color</label>
              <select id="qr-color-preset">
                <option value="#020800">Black</option>
                <option value="#ffffff">White</option>
                <option value="#112378" selected>Dark Blue</option>
                <option value="#0033ff">Blue</option>
                <option value="#17c37b">Green</option>
                <option value="#ffd007">Yellow</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div class="qr-field qr-field-custom" hidden>
              <label for="qr-color-custom">Custom Color</label>
              <input id="qr-color-custom" type="color" value="#112378" />
            </div>
          </div>
          <div class="qr-checkbox">
            <input id="qr-transparent" type="checkbox" />
            <label for="qr-transparent">Transparent background</label>
          </div>

          <div class="qr-output">
            <div class="qr-canvas-wrap">
              <div id="qr-code" aria-label="Generated QR code"></div>
            </div>
            <div class="qr-actions">
              <button id="qr-download" type="button">Download PNG</button>
              <button id="qr-copy" type="button">Copy to clipboard</button>
            </div>
            <p id="qr-status" class="qr-status" role="status"></p>
          </div>
        </div>

        <script src="https://unpkg.com/qr-code-styling@1.9.2/lib/qr-code-styling.js"></script>
        <script type="module">
          const qrUrlInput = document.querySelector("#qr-url");
          const qrColorPreset = document.querySelector("#qr-color-preset");
          const qrColorCustomField = document.querySelector(".qr-field-custom");
          const qrColorCustomInput = document.querySelector("#qr-color-custom");
          const qrTransparentInput = document.querySelector("#qr-transparent");
          const qrCodeContainer = document.querySelector("#qr-code");
          const qrDownloadButton = document.querySelector("#qr-download");
          const qrCopyButton = document.querySelector("#qr-copy");
          const qrStatus = document.querySelector("#qr-status");
          const logoPath = "/_public/images/icon.svg";
          let logoSvgText;
          let qrCode;
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

          function getQrColor() {
            if (qrColorPreset.value === "custom") {
              return qrColorCustomInput.value;
            }

            return qrColorPreset.value;
          }

          function getRelativeLuminance(hexColor) {
            const color = hexColor.replace("#", "");
            const channels = [0, 2, 4].map((index) => {
              const channel = Number.parseInt(color.slice(index, index + 2), 16) / 255;
              return channel <= 0.03928
                ? channel / 12.92
                : ((channel + 0.055) / 1.055) ** 2.4;
            });

            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          }

          function getContrastRatio(color, background = "#ffffff") {
            const colorLuminance = getRelativeLuminance(color);
            const backgroundLuminance = getRelativeLuminance(background);
            const lighter = Math.max(colorLuminance, backgroundLuminance);
            const darker = Math.min(colorLuminance, backgroundLuminance);

            return (lighter + 0.05) / (darker + 0.05);
          }

          function getReliabilityWarning(color, transparentBackground) {
            const normalizedColor = color.toLowerCase();

            if (normalizedColor === "#ffffff") {
              return "White foreground is unlikely to scan on light backgrounds.";
            }

            if (transparentBackground) {
              return "Transparent QR codes depend on the final placement surface for scan reliability.";
            }

            if (normalizedColor === "#ffd007") {
              return "Yellow foreground on a white background may be difficult to scan.";
            }

            if (qrColorPreset.value === "custom" && getContrastRatio(color) < 3) {
              return "This custom color has low contrast against a white background.";
            }

            return "";
          }

          function setColorControlVisibility() {
            qrColorCustomField.hidden = qrColorPreset.value !== "custom";
          }

          async function getLogoDataUrl(color) {
            const svgText = await getLogoSvgText();
            const coloredSvg = svgText
              .replaceAll('fill="#fff"', \`fill="\${color}"\`)
              .replaceAll("fill='#fff'", \`fill="\${color}"\`);

            return \`data:image/svg+xml;charset=utf-8,\${encodeURIComponent(coloredSvg)}\`;
          }

          function getQrOptions({
            url,
            color,
            transparentBackground,
            logoDataUrl,
          }) {
            return {
              width: 768,
              height: 768,
              margin: 32,
              type: "canvas",
              data: url,
              image: logoDataUrl,
              qrOptions: {
                errorCorrectionLevel: "H",
              },
              dotsOptions: {
                color,
                type: "dots",
                roundSize: true,
              },
              cornersSquareOptions: {
                color,
                type: "extra-rounded",
              },
              cornersDotOptions: {
                color,
                type: "square",
              },
              backgroundOptions: {
                color: transparentBackground ? "transparent" : "#ffffff",
              },
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 8,
              },
            };
          }

          function updateQrCode(options) {
            if (!qrCode) {
              qrCode = new window.QRCodeStyling(options);
              qrCode.append(qrCodeContainer);
              return;
            }

            qrCode.update(options);
          }

          async function renderQr() {
            const url = validateUrl();
            const color = getQrColor();
            const transparentBackground = qrTransparentInput.checked;
            const currentRenderId = ++renderId;

            qrDownloadButton.disabled = true;
            qrCopyButton.disabled = true;

            if (!url) {
              qrCodeContainer.replaceChildren();
              qrCode = null;
              setStatus("Enter a full URL, including https://.", "error");
              return;
            }

            try {
              const logoDataUrl = await getLogoDataUrl(color);
              if (currentRenderId !== renderId) return;

              updateQrCode(getQrOptions({
                url,
                color,
                transparentBackground,
                logoDataUrl,
              }));

              qrDownloadButton.disabled = false;
              qrCopyButton.disabled = false;
              const reliabilityWarning = getReliabilityWarning(color, transparentBackground);
              setStatus(reliabilityWarning, reliabilityWarning ? "warning" : "");
            } catch (error) {
              console.error(error);
              setStatus("QR code could not be generated.", "error");
            }
          }

          async function getQrCodeBlob() {
            if (!qrCode) {
              throw new Error("QR code image could not be created.");
            }

            return qrCode.getRawData("png");
          }

          setColorControlVisibility();

          qrUrlInput.addEventListener("input", renderQr);
          qrColorPreset.addEventListener("change", () => {
            setColorControlVisibility();
            renderQr();
          });
          qrColorCustomInput.addEventListener("input", renderQr);
          qrTransparentInput.addEventListener("change", renderQr);

          qrDownloadButton.addEventListener("click", async () => {
            const blob = await getQrCodeBlob();
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
              const blob = await getQrCodeBlob();
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
