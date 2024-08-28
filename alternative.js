// Set up Axios defaults
axios.defaults.baseURL = 'https://api.thecatapi.com/v1/';
axios.defaults.headers.common['x-api-key'] = 'live_oH7oBOZjOxoX8yGKd2bG0RZExMQD0yBABqytKYBqLmjXYpt2Q7Ce78c5LNJeRIG7';

// Add request interceptor
axios.interceptors.request.use(config => {
    console.log('Request started:', new Date().toLocaleTimeString());
    document.body.style.cursor = 'progress';
    document.getElementById('progressBar').style.width = '0%';
    return config;
}, error => {
    return Promise.reject(error);
});

// Add response interceptor
axios.interceptors.response.use(response => {
    console.log('Response received:', new Date().toLocaleTimeString());
    document.body.style.cursor = 'default';
    return response;
}, error => {
    return Promise.reject(error);
});

// Add progress interceptor
axios.defaults.onDownloadProgress = function (progressEvent) {
    if (progressEvent.lengthComputable) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        document.getElementById('progressBar').style.width = `${percentCompleted}%`;
        console.log('Download progress:', percentCompleted, '%');
    }
};

// Initialize with breeds and populate the select menu
async function initialLoad() {
    try {
        const response = await axios.get('breeds');
        const breeds = response.data;
        const select = document.getElementById('breedSelect');
        select.innerHTML = breeds.map(breed => `<option value="${breed.id}">${breed.name}</option>`).join('');

        // Load initial carousel with the first breed
        if (breeds.length > 0) {
            select.value = breeds[0].id;
            await loadBreedData(breeds[0].id);
        }
    } catch (error) {
        console.error('Error loading breeds:', error);
    }
}

// Load breed data and update the carousel
async function loadBreedData(breedId) {
    try {
        // Fetch breed-specific data
        const response = await axios.get('images/search', { params: { limit: 5, breed_ids: breedId } });
        const images = response.data;

        const carouselInner = document.getElementById('carouselInner');
        const template = document.getElementById('carouselItemTemplate').content;
        carouselInner.innerHTML = '';

        images.forEach(image => {
            const clone = document.importNode(template, true);
            const img = clone.querySelector('img');
            img.src = image.url;
            img.alt = image.id;
            clone.querySelector('.favourite-button').setAttribute('data-img-id', image.id);
            carouselInner.appendChild(clone);
        });

        // Update infoDump with breed information
        const breedResponse = await axios.get(`breeds/${breedId}`);
        const breedInfo = breedResponse.data;
        document.getElementById('infoDump').innerHTML = `
            <h3>${breedInfo.name}</h3>
            <p>${breedInfo.description}</p>
            <p>Origin: ${breedInfo.origin}</p>
        `;
    } catch (error) {
        console.log('Error loading breed data:', error);
    }
}

// Event handler for breed selection
document.getElementById('breedSelect').addEventListener('change', function () {
    loadBreedData(this.value);
});

// Event handler for Get Favorites button
document.getElementById('getFavouritesBtn').addEventListener('click', async function () {
    try {
        const response = await axios.get('favourites');
        const favourites = response.data;

        const carouselInner = document.getElementById('carouselInner');
        const template = document.getElementById('carouselItemTemplate').content;
        carouselInner.innerHTML = '';

        favourites.forEach(favourite => {
            const clone = document.importNode(template, true);
            const img = clone.querySelector('img');
            img.src = favourite.image.url;
            img.alt = favourite.image.id;
            clone.querySelector('.favourite-button').setAttribute('data-img-id', favourite.id);
            carouselInner.appendChild(clone);
        });

        // Activate carousel
        if (favourites.length > 0) {
            const carousel = new bootstrap.Carousel(document.getElementById('carouselExampleControls'));
            carousel.refresh();
        }
    } catch (error) {
        console.error('Error fetching favourites:', error);
    }
});

// Function to toggle favourite
async function favourite(imageId) {
    try {
        // Check if the image is already favourited
        const response = await axios.get(`favourites?image_id=${imageId}`);
        const favourites = response.data;

        if (favourites.length > 0) {
            // Remove favourite
            await axios.delete(`favourites/${favourites[0].id}`);
        } else {
            // Add favourite
            await axios.post('favourites', { image_id: imageId });
        }
    } catch (error) {
        console.error('Error favouriting image:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initialLoad);
