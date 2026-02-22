document.addEventListener('DOMContentLoaded', () => {
    // Pedir clave de acceso a coordinación
    const accessPass = prompt("ACCESO RESTRINGIDO - COORDINACIÓN\nIntroduzca la clave:");
    if (accessPass !== "124578963") {
        alert("CLAVE INCORRECTA - VOLVIENDO AL MAPA");
        window.location.href = "../../mapa.html";
        return;
    }

    const coordGrid = document.getElementById('coordGrid');
    const mainTitle = document.getElementById('mainTitle');
    const addAreaBtn = document.getElementById('addAreaBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exportBtn = document.getElementById('exportBtn');
    const publishBtn = document.getElementById('publishBtn');

    // Áreas por defecto recomendadas
    const defaultAreas = [
        { title: "PASILLO DE LA PASTA", names: ["", ""] },
        { title: "PASILLO PANES", names: ["", ""] },
        { title: "PASILLO CAFÉ", names: ["", "", "", ""] },
        { title: "PASILLO GALLETA", names: ["", "", "", ""] },
        { title: "PASILLO SALSA", names: ["", "", "", ""] },
        { title: "PASILLO TULIPAN", names: ["", "", "", ""] },
        { title: "PASILLO PAPEL", names: ["", ""] },
        { title: "PASILLO GRANOS", names: ["", "", ""] },
        { title: "CAVA CUARTO", names: ["", "", "", ""] },
        { title: "PARED 1", names: ["", ""] },
        { title: "PARED 2", names: ["", ""] },
        { title: "PASILLO 1,2,3 ARRIBA", names: ["", ""] },
        { title: "PASILLO 4,5,6 ARRIBA", names: ["", ""] },
        { title: "DEPOSITO ARRIBA", names: ["", ""] },
        { title: "DEPOSITO ABAJO", names: ["", "", "", ""] },
        { title: "REGUERA", names: ["", ""] }
    ];

    // Cargar datos
    let savedData = JSON.parse(localStorage.getItem('coordinacionData')) || {
        title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
        areas: defaultAreas
    };

    mainTitle.textContent = savedData.title;

    const renderGrid = () => {
        coordGrid.innerHTML = '';
        savedData.areas.forEach((area, index) => {
            const card = document.createElement('article');
            card.className = 'area-card';

            let namesHTML = '';
            area.names.forEach((name, nIndex) => {
                namesHTML += `<input type="text" class="name-input" value="${name}" data-area="${index}" data-name="${nIndex}" placeholder="NOMBRE...">`;
            });

            card.innerHTML = `
                <div class="area-header">
                    <span class="area-title" contenteditable="true" data-index="${index}">${area.title}</span>
                </div>
                <div class="names-list">
                    ${namesHTML}
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <button class="btn-add-name" onclick="addName(${index})" style="background:none; border:none; color:#3ca1e3; cursor:pointer; font-size:0.75rem;">+ persona</button>
                        <button class="btn-remove-area" onclick="removeArea(${index})" style="background:none; border:none; color:#eb5757; cursor:pointer; font-size:0.75rem;">eliminar</button>
                    </div>
                </div>
            `;
            coordGrid.appendChild(card);
        });

        // Actualizar datos al cambiar nombres
        document.querySelectorAll('.name-input').forEach(input => {
            input.onchange = (e) => {
                const aIdx = e.target.dataset.area;
                const nIdx = e.target.dataset.name;
                savedData.areas[aIdx].names[nIdx] = e.target.value.toUpperCase();
            };
        });

        // Actualizar títulos
        document.querySelectorAll('.area-title').forEach(title => {
            title.onblur = (e) => {
                const idx = e.target.dataset.index;
                savedData.areas[idx].title = e.target.textContent.toUpperCase();
            };
        });
    };

    window.addName = (areaIndex) => {
        savedData.areas[areaIndex].names.push("");
        renderGrid();
    };

    window.removeArea = (index) => {
        if (confirm("¿Eliminar toda esta área?")) {
            savedData.areas.splice(index, 1);
            renderGrid();
        }
    };

    addAreaBtn.onclick = () => {
        savedData.areas.push({ title: "NUEVO ÁREA", names: ["", ""] });
        renderGrid();
    };

    saveBtn.onclick = () => {
        savedData.title = mainTitle.textContent;
        localStorage.setItem('coordinacionData', JSON.stringify(savedData));
        alert("¡Datos de coordinación guardados correctamente!");
    };

    publishBtn.onclick = () => {
        savedData.title = mainTitle.textContent;
        localStorage.setItem('coordinacionData', JSON.stringify(savedData));

        // Crear un objeto simplificado para el mapa
        const staffMap = {};
        savedData.areas.forEach(area => {
            staffMap[area.title] = area.names.filter(n => n.trim() !== "").join(" / ");
        });

        localStorage.setItem('publishedStaff', JSON.stringify(staffMap));
        alert("📢 ¡LISTA PUBLICADA! Ahora los nombres aparecerán en el mapa de pasillos.");
    };

    clearBtn.onclick = () => {
        const pass = prompt("CONTRASEÑA PARA BORRAR TODO:");
        if (pass === "085030140") {
            savedData = {
                title: `EQUIPO DE INVENTARIO ${new Date().toLocaleDateString()}`,
                areas: defaultAreas
            };
            mainTitle.textContent = savedData.title;
            renderGrid();
        } else if (pass !== null) {
            alert("CONTRASEÑA INCORRECTA");
        }
    };

    exportBtn.onclick = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Coordinación');
        // ... (lógica de excel previo se mantiene)
        const headerRow = worksheet.addRow([mainTitle.textContent]);
        worksheet.mergeCells('A1:H1');
        headerRow.height = 30;
        headerRow.getCell(1).font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
        headerRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

        let row = 3;
        let col = 1;
        savedData.areas.forEach((area) => {
            const cell = worksheet.getCell(row, col);
            cell.value = area.title;
            cell.font = { bold: true };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5DBDB' } };
            area.names.forEach((name, nIdx) => {
                worksheet.getCell(row + 1 + nIdx, col).value = name || "";
            });
            col++;
            if (col > 4) { col = 1; row += 8; }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Coordinacion_${new Date().toLocaleDateString()}.xlsx`);
    };

    renderGrid();
});
