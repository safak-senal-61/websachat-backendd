document.addEventListener('DOMContentLoaded', () => {
    const modelListElement = document.getElementById('model-list');

    if (!modelListElement) {
        console.error('Model list element not found!');
        return;
    }

    fetch('/api/v1/db/models')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(models => {
            modelListElement.innerHTML = ''; // Clear "Loading..."
            if (models && models.length > 0) {
                models.forEach(modelName => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    // Model adını table.html'e query parametresi olarak gönder
                    link.href = `table.html?model=${encodeURIComponent(modelName)}`;
                    link.textContent = modelName;
                    listItem.appendChild(link);
                    modelListElement.appendChild(listItem);
                });
            } else {
                modelListElement.innerHTML = '<li>No models found or unable to fetch models.</li>';
            }
        })
        .catch(error => {
            console.error('Error fetching models:', error);
            modelListElement.innerHTML = `<li>Error fetching models: ${error.message}</li>`;
        });
});
