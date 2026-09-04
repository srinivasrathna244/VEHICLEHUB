/**
 * VehicleHub Sell/Edit Listing Client Scripts
 * - Image Drag-and-Drop & Preview (up to 10 images)
 * - Dynamic Category Specific Field Highlighting
 */

document.addEventListener("DOMContentLoaded", () => {
    const imageInput = document.getElementById("imageInput");
    const previewGrid = document.getElementById("previewGrid");
    const uploadArea = document.getElementById("uploadArea");

    if (imageInput && previewGrid) {
        imageInput.addEventListener("change", function () {
            previewGrid.innerHTML = "";
            const files = Array.from(this.files);

            if (files.length > 10) {
                alert("You can upload a maximum of 10 photos.");
                this.value = "";
                return;
            }

            files.forEach((file, index) => {
                if (!file.type.startsWith("image/")) return;

                if (file.size > 5 * 1024 * 1024) {
                    alert(`Photo "${file.name}" exceeds the 5MB size limit.`);
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    const wrap = document.createElement("div");
                    wrap.className = "preview-thumb-wrap";

                    const img = document.createElement("img");
                    img.src = e.target.result;
                    img.alt = "Preview";

                    if (index === 0) {
                        const badge = document.createElement("span");
                        badge.textContent = "Primary";
                        badge.style.position = "absolute";
                        badge.style.top = "4px";
                        badge.style.left = "4px";
                        badge.style.background = "#2563eb";
                        badge.style.color = "#fff";
                        badge.style.fontSize = "10px";
                        badge.style.padding = "2px 6px";
                        badge.style.borderRadius = "4px";
                        wrap.appendChild(badge);
                    }

                    wrap.appendChild(img);
                    previewGrid.appendChild(wrap);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Drag and Drop Effects
    if (uploadArea) {
        ["dragenter", "dragover"].forEach(event => {
            uploadArea.addEventListener(event, (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = "#2563eb";
                uploadArea.style.background = "#eff6ff";
            });
        });

        ["dragleave", "drop"].forEach(event => {
            uploadArea.addEventListener(event, (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = "#cbd5e1";
                uploadArea.style.background = "#f8fafc";
            });
        });
    }
});
