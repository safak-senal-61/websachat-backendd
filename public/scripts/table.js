document.addEventListener('DOMContentLoaded', () => {
    const tableTitleElement = document.getElementById('table-title');
    const dataTableContainerElement = document.getElementById('data-table-container');

    if (!tableTitleElement || !dataTableContainerElement) {
        console.error('Required elements not found on table.html!');
        return;
    }

    // Get model name from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const modelName = params.get('model');

    if (!modelName) {
        tableTitleElement.textContent = 'Error: Model name not provided';
        dataTableContainerElement.innerHTML = '<p class="empty-state">No model specified in the URL.</p>';
        return;
    }

    tableTitleElement.textContent = `Data for Model: ${modelName}`;

    fetch(`/api/v1/db/models/${encodeURIComponent(modelName)}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`HTTP error! status: ${response.status}, Message: ${err.message || 'Unknown error'}`);
                });
            }
            return response.json();
        })
        .then(data => {
            dataTableContainerElement.innerHTML = ''; // Clear "Loading..."
            if (data && data.length > 0) {
                const table = document.createElement('table');
                const thead = document.createElement('thead');
                const tbody = document.createElement('tbody');
                const headerRow = document.createElement('tr');

                // Create table headers from the keys of the first object
                const headers = Object.keys(data[0]);
                headers.forEach(headerText => {
                    const th = document.createElement('th');
                    th.textContent = headerText;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Create table rows
                data.forEach(item => {
                    const row = document.createElement('tr');
                    headers.forEach(header => {
                        const td = document.createElement('td');
                        // Handle complex objects/arrays by stringifying them
                        if (typeof item[header] === 'object' && item[header] !== null) {
                            td.textContent = JSON.stringify(item[header], null, 2); // Pretty print JSON
                        } else {
                            td.textContent = item[header] === null || typeof item[header] === 'undefined' ? 'NULL' : item[header];
                        }
                        row.appendChild(td);
                    });
                    tbody.appendChild(row);
                });
                table.appendChild(tbody);
                dataTableContainerElement.appendChild(table);
            } else if (data && data.length === 0) {
                dataTableContainerElement.innerHTML = '<p class="empty-state">No data found for this model.</p>';
            } else {
                 dataTableContainerElement.innerHTML = '<p class="empty-state">Could not load data for this model.</p>';
            }
        })
        .catch(error => {
            console.error(`Error fetching data for model ${modelName}:`, error);
            dataTableContainerElement.innerHTML = `<p class="empty-state">Error fetching data: ${error.message}</p>`;
        });
});
