export function addComment(movieTitle, commentTitle, commentText, commentRating) {

    const existingComments = JSON.parse(localStorage.getItem('movieComments')) || [];

    // Add the new comment to the array
    existingComments.push({
        movieTitle: movieTitle,
        commentTitle: commentTitle,
        commentText: commentText,
        commentRating: commentRating
    });

    // Save the updated comments array back to local storage
    localStorage.setItem('movieComments', JSON.stringify(existingComments));


    const comment = {
        movieTitle,
        commentTitle,
        commentText,
        commentRating,
    };

    // Add your logic to store or display the comment
    // For example, update the UI or store the comment in local storage
    console.log('Comment added:', comment);
}

document.addEventListener('DOMContentLoaded', () => {
    renderComments();

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('share-btn')) {
            const index = e.target.getAttribute('data-index');
            const commentCard = document.getElementById(`comment-${index}`);

            html2canvas(commentCard).then(canvas => {
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
                                // Si no se puede compartir archivos, al menos descarga
                                downloadImage(imageData);
                            }
                        });
                } else {
                    // Si no está disponible la Web Share API
                    downloadImage(imageData);
                }
            });
        }
    });
});

function renderComments() {
    const commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = '';
    const existingComments = JSON.parse(localStorage.getItem('movieComments')) || [];

    existingComments.forEach((comment, index) => {
        const commentCard = document.createElement('div');
        commentCard.classList.add('comment-card', 'p-3', 'mb-3', 'border', 'rounded');
        commentCard.id = `comment-${index}`;
        
        commentCard.innerHTML = `
            <h4>${comment.commentTitle}</h4>
            <p>${comment.commentText}</p>
            <p><strong>Rating:</strong> ${comment.commentRating}</p>
            <button class="btn btn-primary share-btn" data-index="${index}">Compartir Reseña</button>
        `;

        commentsContainer.appendChild(commentCard);
    });
}

function downloadImage(imageData) {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'reseña.png';
    link.click();
}
