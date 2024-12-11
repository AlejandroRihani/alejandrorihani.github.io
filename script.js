import { addToPersonalCollection } from "./moviestorage.js";
import { addComment } from './comments.js';

let selectedMovieTitle = '';

document.addEventListener('DOMContentLoaded', function () { //Barra de búsqueda
    const busqueda = document.querySelector("#busqueda");
    busqueda.addEventListener('input', debounce(searchMovies, 500));
});

document.addEventListener('DOMContentLoaded', function () { //Compartir link
    const shareButton = document.getElementById('share-button');
    if (shareButton) {
        shareButton.addEventListener('click', function () {
            const shareLink = getShareLink(); // Implement this function to get the share link
            updateShareModal(shareLink);
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const moviesContainer = document.querySelector('.movies-container');
    if (moviesContainer) {
        moviesContainer.addEventListener('click', function (event) {
            const movieElement = event.target.closest('.movie');
            if (movieElement) {
                // Update the selectedMovieTitle when a movie is clicked
                selectedMovieTitle = movieElement.querySelector('.informacion p').textContent;
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function () { //Añadir comentario
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', function (event) {
            event.preventDefault();

            // Get values from the form
            const commentTitle = document.getElementById('commentTitle').value;
            const commentText = document.getElementById('commentText').value;
            const commentRating = document.getElementById('commentRating').value;

            // Add the comment using the imported function
            addComment(selectedMovieTitle, commentTitle, commentText, commentRating);

            // Clear the form
            commentForm.reset();

            // Actualizar la lista de comentarios luego de agregar uno nuevo
            displayComments();
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Display comments in Bootstrap cards
    displayComments();
});

// Listener para el botón de compartir reseña
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('share-btn')) {
        const index = e.target.getAttribute('data-index');
        const card = document.querySelectorAll('#commentsContainer .card')[index];

        if (!card) return;

        // Usar html2canvas para crear una captura de la tarjeta del comentario
        html2canvas(card).then(canvas => {
            const imageData = canvas.toDataURL('image/png');

            if (navigator.share && navigator.canShare) {
                fetch(imageData)
                    .then(res => res.blob())
                    .then(blob => {
                        const filesArray = [
                            new File([blob], 'reseña.png', { type: 'image/png' })
                        ];

                        if (navigator.canShare({ files: filesArray })) {
                            navigator.share({
                                title: 'Mira esta reseña',
                                text: 'Te comparto esta reseña de película',
                                files: filesArray
                            }).catch(err => console.log('Error al compartir:', err));
                        } else {
                            downloadImage(imageData);
                        }
                    });
            } else {
                // Si no está disponible la Web Share API, se descarga la imagen
                downloadImage(imageData);
            }
        });
    }
});

function debounce(func, delay) {
    let timeoutId;
    return function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, arguments);
        }, delay);
    };
}

async function searchMovies() {
    const busqueda = document.querySelector("#busqueda");
    const query = busqueda.value.trim();

    const contenedor_de_peliculas = document.querySelector(".movies-container");

    if (!query) {
        console.log("empty query!");
        contenedor_de_peliculas.innerHTML = "";
        return;
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZTA1OWI5MTY0NzZiZDEzMmQzNjVkMzNlYmUwZTBkYSIsIm5iZiI6MTczMjU3ODUxMi43MjA2NDk3LCJzdWIiOiI2NzQ1MGJmODlmNDBhN2FhZjZlYTcwZDEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.UYbENwXb9b5QxHmIN2BYVGz2_xyiB37M4gi4s4LJiNU'
        }
    };

    try {
        const [moviesResponse, tvResponse] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=true&language=es-MX&page=1`, options),
            fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&include_adult=true&language=es-MX&page=1`, options)
        ]);

        if (!moviesResponse.ok || !tvResponse.ok) {
            throw new Error(`Error HTTP: ${moviesResponse.status} y/o ${tvResponse.status}`);
        }

        const [movies, tv] = await Promise.all([moviesResponse.json(), tvResponse.json()]);

        getMovies(movies);
        getTv(tv);

    } catch (error) {
        console.error('API Error:', error);
        contenedor_de_peliculas.innerHTML = `<p>Error al cargar resultados. Inténtalo más tarde.</p>`;
    }
}

function getMovies(peliculas) {
    const template_peliculas = document.querySelector("#template-container");
    const fragmento = document.createDocumentFragment();

    peliculas.results.forEach(pelicula => {
        const template = document.importNode(template_peliculas.content, true);
        template.querySelector('.movie').setAttribute('data-id', `movie-${pelicula.id}`);
        template.querySelector('.movie').setAttribute('data-type', 'movie');

        const nombrePelicula = template.querySelector("p");
        nombrePelicula.textContent = pelicula.title;

        const posterPelicula = template.querySelector(".poster-pelicula img");
        const imagen = pelicula.poster_path ?? "assets/not-found.jpg";

        if (pelicula.poster_path == undefined) {
            posterPelicula.setAttribute("src", imagen);
        } else {
            posterPelicula.setAttribute("src", "https://image.tmdb.org/t/p/original" + imagen);
        }

        fragmento.appendChild(template);
    });

    const contenedor_de_peliculas = document.querySelector(".movies-container");

    contenedor_de_peliculas.addEventListener('click', function (event) {
        const movieElement = event.target.closest('.movie[data-type="movie"]');
        if (movieElement) {
            const movieId = movieElement.getAttribute('data-id');
            const isMovie = movieElement.getAttribute('data-type') === 'movie';
            const movieData = isMovie ? peliculas.results.find(movie => `movie-${movie.id}` === movieId) : null;
            loadDetailsModal(movieData, isMovie);
        }
    });

    contenedor_de_peliculas.appendChild(fragmento);
}

function getTv(series) {
    const template_peliculas = document.querySelector("#template-container");
    const fragmento = document.createDocumentFragment();

    series.results.forEach(serie => {
        const template = document.importNode(template_peliculas.content, true);
        template.querySelector('.movie').setAttribute('data-id', `tv-${serie.id}`);
        template.querySelector('.movie').setAttribute('data-type', 'tv');

        const nombreSerie = template.querySelector("p");
        nombreSerie.textContent = serie.name;

        const posterSerie = template.querySelector(".poster-pelicula img");
        const imagen = serie.poster_path ?? "assets/not-found.jpg";

        if (serie.poster_path == undefined) {
            posterSerie.setAttribute("src", imagen);
        } else {
            posterSerie.setAttribute("src", "https://image.tmdb.org/t/p/original" + imagen);
        }

        fragmento.appendChild(template);
    });

    const contenedor_de_peliculas = document.querySelector(".movies-container");

    contenedor_de_peliculas.addEventListener('click', function (event) {
        const tvElement = event.target.closest('.movie[data-type="tv"]');
        if (tvElement) {
            const tvId = tvElement.getAttribute('data-id');
            const tvData = series.results.find(tv => `tv-${tv.id}` === tvId);
            loadDetailsModal(tvData, false);
        }
    });

    contenedor_de_peliculas.appendChild(fragmento);
}

function clearScreen() {
    const contenedor_de_peliculas = document.querySelector(".movies-container");
    contenedor_de_peliculas.innerHTML = "";
}

function loadDetailsModal(data, isMovie) {
    const modalTitle = document.getElementById('movieModalLabel');
    const modalBody = document.querySelector('.modal-body');

    modalTitle.textContent = isMovie ? data.title : data.name;
    modalBody.innerHTML = '';

    const modalContent = document.createElement('div');

    if (data.poster_path && data.overview && (isMovie ? data.release_date : data.first_air_date)) {
        modalContent.innerHTML = `
            <img src="https://image.tmdb.org/t/p/original${data.poster_path}" alt="${isMovie ? data.title : data.name}" class="modal-poster">
            <p>${data.overview}</p>
            <p>${isMovie ? 'Release Date' : 'First Air Date'}: ${isMovie ? data.release_date : data.first_air_date}</p>
        `;
    } else {
        modalContent.textContent = 'Details not available.';
    }

    const addToCollectionButton = document.getElementById('collection-button');
    addToCollectionButton.onclick = null;

    addToCollectionButton.onclick = function () {
        addToPersonalCollection(data);
        alert('Movie/TV series added to your collection!');
    };

    modalBody.appendChild(modalContent);
}

// Funciones de compartir
function getShareLink() {
    const selectedMovieId = getSelectedMovieId();
    return `https://movieadmin.com/movie/${selectedMovieId}`;
}

function updateShareModal(shareLink) {
    const shareLinkParagraph = document.getElementById('shareModalLabel');
    shareLinkParagraph.textContent = `Compartir este enlace: ${shareLink}`;
}

function getSelectedMovieId() {
    const selectedMovieElement = document.querySelector('.movie');
    return selectedMovieElement ? selectedMovieElement.dataset.id : '';
}

function displayComments() {
    const comments = JSON.parse(localStorage.getItem('movieComments')) || [];
    const commentsContainer = document.getElementById('commentsContainer');

    if (!commentsContainer) return;

    commentsContainer.innerHTML = '';

    comments.forEach((comment, index) => {
        const card = document.createElement('div');
        card.classList.add('card', 'mb-3');

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');

        const cardTitle = document.createElement('h5');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = comment.movieTitle;

        const cardSubtitle = document.createElement('h6');
        cardSubtitle.classList.add('card-subtitle', 'mb-2', 'text-muted');
        cardSubtitle.textContent = comment.commentTitle;

        const cardText = document.createElement('p');
        cardText.classList.add('card-text');
        cardText.textContent = comment.commentText;

        const cardRating = document.createElement('p');
        cardRating.classList.add('card-text');
        cardRating.textContent = `Rating: ${comment.commentRating} ⭐`;

        // Botón de compartir reseña
        const shareButton = document.createElement('button');
        shareButton.classList.add('btn', 'btn-primary', 'share-btn');
        shareButton.textContent = 'Compartir Reseña';
        shareButton.setAttribute('data-index', index);

        // Append elements to card body
        cardBody.appendChild(cardTitle);
        cardBody.appendChild(cardSubtitle);
        cardBody.appendChild(cardText);
        cardBody.appendChild(cardRating);
        cardBody.appendChild(shareButton);

        card.appendChild(cardBody);
        commentsContainer.appendChild(card);
    });
}

function downloadImage(imageData) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'reseña.png';
    link.click();
}
