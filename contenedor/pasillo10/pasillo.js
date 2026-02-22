document.addEventListener('DOMContentLoaded', () => {
    // Current date
    const dateTag = document.getElementById('current-date');
    const now = new Date();
    dateTag.textContent = `FECHA: ${now.toLocaleDateString()}`;

    // Sincronizar nombres del encabezado desde sessionStorage
    const responsable = sessionStorage.getItem('responsableDirecto') || "SIN ASIGNAR";
    const companero = sessionStorage.getItem('companero') || "SIN ASIGNAR";

    document.getElementById('team1-resp1').textContent = responsable.toUpperCase();
    document.getElementById('team1-resp2').textContent = companero.toUpperCase();

    const inventoryBody = document.getElementById('inventory-body');
    let products = [
        "ACEITE DE OLIVA 250ML",
        "ACEITE DE OLIVA 500ML",
        "ALIÑOS SAN MIGUEL GRANDE",
        "ALIÑOS SAN MIGUEL PEQUEÑO",
        "ALUMINIO ROLLO",
        "FIDEOS CAPRI",
        "PANELA DULCE",
        "PASTA CAPRI CORTA",
        "PASTA ESPECIAL LARGA",
        "PASTA CAPRI LARGA",
        "PASTA INTEGRAL",
        "PASTA PRIMOR NEGRA LARGA Y CORTA"
    ];

    let searchTerm = "";

    // Cargar datos guardados (ahora guardamos objetos {qty, history})
    let inventoryData = JSON.parse(sessionStorage.getItem('inventoryData')) || {};

    const renderTable = () => {
        inventoryBody.innerHTML = '';
        const filteredProducts = products.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase()));

        filteredProducts.forEach(p => {
            const data = inventoryData[p] || { qty: 0, history: "", checkState: 0, redQty: null };
            const row = document.createElement('tr');
            row.className = 'product-row';

            // Calcular diferencia para mostrar en UI si está en VERDE o ROJO
            let diffHTML = "";
            if ((data.checkState === 1 || data.checkState === 2) && data.redQty !== null && data.redQty !== undefined && data.qty > data.redQty) {
                diffHTML = `<span class="diff-tag">+${data.qty - data.redQty}</span>`;
            }

            row.innerHTML = `
                <td class="col-check">
                    <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <div class="indicator state-${data.checkState || 0}"></div> 
                        <span class="product-name">${p}</span>
                        <span class="edit-product-btn" title="Acciones" style="font-size: 0.8rem; opacity: 0.8; margin-left: 8px; cursor: pointer;">✒️</span>
                    </div>
                </td>
                <td class="col-qty" style="cursor: pointer;">
                    <span class="qty-val" id="qty-${p.replace(/\s/g, '_')}">${data.qty ?? 0}</span>
                    ${diffHTML}
                </td>
            `;

            // Click en el indicador/nombre cicla entre 4 estados (0: Neutro, 1: Verde, 2: Rojo, 3: Azul)
            const checkArea = row.querySelector('.indicator');
            checkArea.onclick = (e) => {
                e.stopPropagation();
                const currentData = inventoryData[p] || { qty: 0, history: "", checkState: 0, redQty: null };
                let newState = ((currentData.checkState || 0) + 1) % 4;

                // Si pasamos a ROJO (estado 2), grabamos la cantidad actual como base
                let redQty = currentData.redQty;
                if (newState === 2) {
                    redQty = currentData.qty || 0;
                }

                inventoryData[p] = { ...currentData, checkState: newState, redQty: redQty };
                sessionStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                renderTable();
            };

            // Click en la plumita para editar o eliminar
            const editBtn = row.querySelector('.edit-product-btn');
            editBtn.onclick = (e) => {
                e.stopPropagation();
                const choice = prompt(`Acciones para "${p}":\n1. Renombrar\n2. Eliminar Producto\n(Escriba 1 o 2)`);

                if (choice === "1") {
                    const newName = prompt("Editar nombre del producto:", p);
                    if (newName && newName.trim() && newName.trim().toUpperCase() !== p) {
                        const finalName = newName.trim().toUpperCase();
                        if (products.includes(finalName)) {
                            alert("Ya existe un producto con ese nombre.");
                            return;
                        }

                        const index = products.indexOf(p);
                        if (index !== -1) {
                            products[index] = finalName;
                            inventoryData[finalName] = inventoryData[p];
                            delete inventoryData[p];
                            sessionStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                            renderTable();
                        }
                    }
                } else if (choice === "2") {
                    if (confirm(`¿Está seguro de que desea eliminar el producto "${p}"?`)) {
                        const index = products.indexOf(p);
                        if (index !== -1) {
                            products.splice(index, 1);
                            delete inventoryData[p];
                            sessionStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                            renderTable();
                            alert("Producto eliminado.");
                        }
                    }
                }
            };

            // Click en la cantidad abre la calculadora
            const qtyArea = row.querySelector('.col-qty');
            qtyArea.onclick = () => openCalculator(p);

            inventoryBody.appendChild(row);
        });
    };

    renderTable();

    // Calculator Logic
    const modal = document.getElementById('calcModal');
    const calcProductName = document.getElementById('calc-product-name');
    const calcHistory = document.getElementById('calcHistory');
    const calcResult = document.getElementById('calcResult');
    const saveBtn = document.getElementById('calcSave');
    const cancelBtn = document.getElementById('calcCancel');

    const calculateRunningTotal = (expr) => {
        try {
            const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').trim();
            const finalExpr = cleanExpr.replace(/[\+\-\*\/]\s*$/, "");
            if (!finalExpr) return 0;
            return eval(finalExpr);
        } catch (e) {
            return 0;
        }
    };

    let currentInput = "0";
    let historyDisplay = "";
    let activeProduct = "";
    let nextInputResets = false;

    const openCalculator = (product) => {
        activeProduct = product;
        calcProductName.textContent = product;

        const data = inventoryData[product] || { qty: 0, history: "" };
        currentInput = data.qty.toString();
        historyDisplay = data.history;

        nextInputResets = true; // El resultado anterior se limpia al escribir un número nuevo
        updateCalcDisplay();
        modal.style.display = 'flex';
    };

    const updateCalcDisplay = () => {
        calcResult.textContent = currentInput;
        calcHistory.textContent = historyDisplay;
    };

    const calculateExpression = (expr) => {
        try {
            // Evaluamos solo la última parte después del último '=' si existe
            let toEval = expr.includes('=') ? expr.split('=').pop().trim() : expr;
            const cleanExpr = toEval.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '.').trim();
            const finalExpr = cleanExpr.replace(/[\+\-\*\/]\s*$/, "");
            if (!finalExpr) return parseFloat(toEval) || 0;
            const result = eval(finalExpr);
            return Number.isFinite(result) ? result : 0;
        } catch (e) {
            return parseFloat(expr) || 0;
        }
    };

    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = e.target.textContent;
            const op = e.target.dataset.op;

            if (op === 'C' || op === 'CE') {
                currentInput = "0";
                historyDisplay = "";
                nextInputResets = false;
            } else if (op === 'DEL') {
                currentInput = currentInput.slice(0, -1) || "0";
            } else if (['+', '-', '*', '/'].includes(op)) {
                // Si el historial termina en igual, ignoramos el reset para continuar sumando a la cadena
                if (historyDisplay.includes('=') && nextInputResets) {
                    historyDisplay += ` ${val} `;
                } else {
                    if (nextInputResets && !historyDisplay.includes('=')) {
                        historyDisplay += ` ${val} `;
                    } else {
                        historyDisplay += `${currentInput} ${val} `;
                    }
                }
                currentInput = calculateExpression(historyDisplay).toString();
                nextInputResets = true;
            } else if (op === '=') {
                if (historyDisplay.includes('=') && nextInputResets) return;

                let exprToSum = historyDisplay + (nextInputResets ? "" : currentInput);
                const total = calculateExpression(exprToSum);

                // Limpiamos el historial para que no termine en operador antes del '='
                let cleanHistory = exprToSum.trim().replace(/[\+\-\*\/]\s*$/, "").trim();
                historyDisplay = `${cleanHistory} = ${total}`;
                currentInput = total.toString();
                nextInputResets = true;
            } else if (!op || val === ',') {
                const symbol = val === ',' ? '.' : val;
                if (nextInputResets) {
                    // Si empezamos un número tras un igual, y NO hay un operador pendiente, añadimos un "+" conector
                    // El regex ahora incluye los símbolos especiales ×, ÷, −
                    if (historyDisplay.includes('=') && !/[\+\-\*\/×÷−]\s*$/.test(historyDisplay)) {
                        historyDisplay += " + ";
                    }
                    currentInput = symbol === "." ? "0." : symbol;
                    nextInputResets = false; // Ya no estamos en estado de reset para el siguiente dígito
                } else {
                    if (currentInput === "0" && symbol !== ".") {
                        currentInput = symbol;
                    } else {
                        if (symbol === "." && currentInput.includes(".")) return;
                        currentInput += symbol;
                    }
                }
            }
            updateCalcDisplay();
        });
    });

    saveBtn.onclick = () => {
        const finalVal = parseFloat(currentInput) || 0;
        const currentData = inventoryData[activeProduct] || {};
        inventoryData[activeProduct] = {
            ...currentData,
            qty: finalVal,
            history: historyDisplay
        };
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
        renderTable();
        modal.style.display = 'none';
    };

    // Excel Export Logic (Professional Format matching Screenshot)
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.onclick = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString();

        // Obtener nombres desde sessionStorage
        const respName = sessionStorage.getItem('responsableDirecto') || "RESPONSABLE";
        const compName = sessionStorage.getItem('companero') || "COMPAÑERO";

        // Map product data and count stars
        let totalInventoried = 0;
        let totalStarsCount = 0;

        const productRows = products.map(p => {
            const data = inventoryData[p] || { qty: 0, history: "0", checkState: 0, redQty: null };
            if ((data.qty || 0) > 0) totalInventoried++;

            // Si está en VERDE o ROJO y la cantidad subió desde la marca base, calculamos la diferencia
            let diferencia = "";
            if ((data.checkState === 1 || data.checkState === 2) && data.redQty !== null && data.redQty !== undefined) {
                // Si la cantidad es diferente al redQty, calculamos la diferencia absoluta para las estrellas
                if (data.qty !== data.redQty) {
                    diferencia = data.qty - data.redQty;
                    totalStarsCount++; // Add star for each difference
                } else if (data.checkState === 1) {
                    diferencia = 0; // Coincidencia exacta en verde
                }
            }

            return [
                data.checkState === 1 ? "CHEQUEADO" : (data.checkState === 2 ? "DESCUADRE" : "PENDIENTE"),
                p,
                data.history || "0",
                data.qty,
                diferencia
            ];
        });

        // Header rows based on screenshot
        const starRow = ["", "★ ".repeat(totalStarsCount).trim(), "", ""];
        const headerRows = [
            ["", "INVENTARIO DE VIVERES 🗃 CECOSESOLA R.L J085030140 🗃", "", ""],
            ["", "PASILLO Nº 1 🛒 DE FERIA DEL ESTE 🛒", "", ""],
            ["", "FECHA", dateStr, ""],
            ["", "RESPONSABLE DIRECTO", respName.toUpperCase(), ""],
            ["", "COMPAÑERO :", compName.toUpperCase(), ""],
            ["", "AYUDANTE :", assistantRole.toUpperCase(), ""],
            starRow, // Row 7 with Stars
            ["ESTADO ✔", "👋 PRODUCTO", "HISTORIAL", "CANTIDAD", "DIFERENCIA"]
        ];

        // Add summary row
        const summaryRows = [
            ["", "", "", "", ""],
            ["", "TOTAL PRODUCTOS INVENTARIADOS:", "", totalInventoried, ""]
        ];

        // Combine everything
        const fullData = [...headerRows, ...productRows, ...summaryRows];

        // Create worksheet and workbook
        const worksheet = XLSX.utils.aoa_to_sheet(fullData);

        worksheet['!cols'] = [
            { wch: 15 }, // ESTADO
            { wch: 45 }, // PRODUCTO
            { wch: 35 }, // HISTORIAL
            { wch: 15 }, // CANTIDAD
            { wch: 15 }  // DIFERENCIA
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

        // Filename: Pasillo 1 - [Responsable]
        XLSX.writeFile(workbook, `Pasillo 1 - ${respName.toUpperCase()}.xlsx`);
    };

    cancelBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

    // Búsqueda en tiempo real
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchTerm = e.target.value;
            renderTable();
        };
    }

    // Agregar Producto
    const addBtn = document.querySelector('.action-btn.purple');
    if (addBtn) {
        addBtn.onclick = () => {
            const newProd = prompt("Ingrese el nombre del nuevo producto:");
            if (newProd && newProd.trim()) {
                const name = newProd.trim().toUpperCase();
                if (!products.includes(name)) {
                    products.push(name);
                    renderTable();
                }
            }
        };
    }


    // Selección de Ayudante (Coordinador / Sistemas)
    const helperBtn = document.getElementById('helperBtn');
    let assistantRole = sessionStorage.getItem('assistantRole_P1') || "SIN ASIGNAR";

    if (helperBtn) {
        helperBtn.onclick = () => {
            const roleChoice = prompt("Seleccione Ayudante:\n1. COORDINADOR\n2. SISTEMAS\n(Escriba 1 o 2)");
            let role = "";
            if (roleChoice === "1") role = "COORDINADOR";
            else if (roleChoice === "2") role = "SISTEMAS";

            if (role) {
                const helperName = prompt(`Ingrese el nombre del ${role}:`);
                if (helperName) {
                    assistantRole = `${role}: ${helperName.toUpperCase()}`;
                    sessionStorage.setItem('assistantRole_P1', assistantRole);
                    alert(`Ayudante asignado: ${assistantRole}`);
                }
            }
        };
    }

    // Limpiar Datos (Papelera)
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            if (confirm("¿Está seguro de que desea limpiar todos los datos de este pasillo?")) {
                const clave = prompt("Ingrese la clave de seguridad para borrar:");
                if (clave === "085030140") {
                    if (confirm("TEN EN CUENTA QUE SE BORRARA TODO. ¿Proceder?")) {
                        inventoryData = {};
                        assistantRole = "SIN ASIGNAR";
                        sessionStorage.removeItem('assistantRole_P1');
                        sessionStorage.setItem('inventoryData', JSON.stringify(inventoryData));
                        renderTable();
                        alert("Datos borrados exitosamente.");
                    }
                } else {
                    alert("Clave incorrecta. Los datos no se han borrado.");
                }
            }
        };
    }
});
