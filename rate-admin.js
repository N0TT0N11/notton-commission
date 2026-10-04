(async () => {
  const root = document.querySelector(".admin-preview");
  if (!root) return;
  const panel = document.createElement("section");
  panel.className = "admin-panel rate-admin-panel";
  panel.innerHTML =
    '<h3>Price rate</h3><p class="small">เพิ่มภาพตัวอย่างได้ตามต้องการ หน้า Price rate แสดงครั้งละ 2 ภาพ เลื่อนด้วยปุ่ม ‹ › ส่วนภาพ Scale แสดงครั้งละ 1 ภาพ</p><p><a href="price-rate.html" target="_blank">เปิดหน้า Price rate ↗</a></p><div class="rate-editor"></div><button type="button" class="primary rate-save">บันทึก Price rate</button><p class="rate-status" role="status"></p>';
  root.append(panel);
  const response = await fetch("price-rate.html");
  const doc = new DOMParser().parseFromString(
    await response.text(),
    "text/html",
  );
  const defaults = { galleries: {}, texts: {} };
  for (const gallery of doc.querySelectorAll(".gallery-component"))
    defaults.galleries[gallery.id] = [...gallery.querySelectorAll("img")].map(
      (img) => ({ src: img.getAttribute("src"), alt: img.alt }),
    );
  for (const el of doc.querySelectorAll(
    "#text09,#text11,#text13,.table-component td,.list-component p",
  )) {
    const key =
      el.id ||
      `${el.closest("[id]").id}-${[...el.closest("[id]").querySelectorAll("td,p")].indexOf(el)}`;
    defaults.texts[key] = el.textContent;
  }
  const site = await window.NottonData.load();
  let model = {
    galleries: { ...defaults.galleries, ...site.priceRate?.galleries },
    texts: { ...defaults.texts, ...site.priceRate?.texts },
  };
  let dirty = false;
  panel.addEventListener("input", () => (dirty = true));
  panel.addEventListener("change", () => (dirty = true));
  window.NottonData.subscribe((updated) => {
    if (!dirty && updated?.priceRate) {
      model = {
        galleries: { ...defaults.galleries, ...updated.priceRate.galleries },
        texts: { ...defaults.texts, ...updated.priceRate.texts },
      };
      draw();
    }
  });
  const target = panel.querySelector(".rate-editor");
  const names = ["Scale", "Render color", "Simple Color", "Chibi A", "Chibi B"];
  function draw() {
    target.replaceChildren();
    let n = 0;
    for (const [id, items] of Object.entries(model.galleries)) {
      const details = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = names[n++] || id;
      details.append(summary);
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.setAttribute("aria-label", "เพิ่มภาพ " + summary.textContent);
      input.onchange = async () => {
        input.disabled = true;
        try {
          for (const file of input.files) {
            const bitmap = await createImageBitmap(file);
            const ratio = Math.min(
              1,
              1600 / Math.max(bitmap.width, bitmap.height),
            );
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(bitmap.width * ratio);
            canvas.height = Math.round(bitmap.height * ratio);
            canvas
              .getContext("2d")
              .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close();
            items.push({
              src: canvas.toDataURL("image/webp", 0.85),
              alt: file.name.replace(/\.[^.]+$/, ""),
            });
          }
          draw();
        } catch (e) {
          panel.querySelector(".rate-status").textContent =
            "อ่านภาพไม่สำเร็จ: " + e.message;
        } finally {
          input.disabled = false;
        }
      };
      details.append(input);
      const list = document.createElement("div");
      list.className = "rate-image-list";
      items.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = "contact-row";
        const img = document.createElement("img");
        img.src = item.src;
        img.alt = "";
        img.loading = "lazy";
        img.style.cssText =
          "width:64px;height:64px;object-fit:cover;border-radius:10px";
        const caption = document.createElement("input");
        caption.value = item.alt || "";
        caption.setAttribute("aria-label", "ชื่อภาพ");
        caption.oninput = () => (item.alt = caption.value);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "ลบ";
        remove.onclick = () => {
          dirty = true;
          items.splice(index, 1);
          draw();
        };
        row.append(img, caption, remove);
        list.append(row);
      });
      details.append(list);
      target.append(details);
    }
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "แก้รายละเอียดและราคาบนหน้า Price rate";
    details.append(summary);
    for (const [key, value] of Object.entries(model.texts)) {
      const label = document.createElement("label");
      label.textContent = defaults.texts[key] || key;
      const input = document.createElement("input");
      input.value = value;
      input.oninput = () => (model.texts[key] = input.value);
      label.append(input);
      details.append(label);
    }
    target.append(details);
  }
  draw();
  panel.querySelector(".rate-save").onclick = async () => {
    const button = panel.querySelector(".rate-save");
    button.disabled = true;
    const status = panel.querySelector(".rate-status");
    status.textContent = "กำลังบันทึก…";
    try {
      const latest = await window.NottonData.load();
      await window.NottonData.save({ ...latest, priceRate: model });
      dirty = false;
      status.textContent = "บันทึก Price rate แล้ว";
    } catch (e) {
      status.textContent = window.NottonData.errorMessage(e);
    } finally {
      button.disabled = false;
    }
  };
})();
