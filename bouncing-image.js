const container = document.getElementById('bouncing-image-container');
const image = document.getElementById('bouncing-image');

const imageSources = [
    'richard.jpg',
    'richard1.jpg',
    'richard2.jpg',
    'richard3.jpg',
    'richard4.jpg'
];
let currentImageIndex = 0;

let x = 0;
let y = 0;
let xSpeed = 2;
let ySpeed = 2;

function changeImage() {
    currentImageIndex = (currentImageIndex + 1) % imageSources.length;
    image.src = imageSources[currentImageIndex];
}

function animate() {
    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    let hitBoundary = false;

    if (x + imageRect.width > containerRect.width || x < 0) {
        xSpeed = -xSpeed;
        hitBoundary = true;
    }

    if (y + imageRect.height > containerRect.height || y < 0) {
        ySpeed = -ySpeed;
        hitBoundary = true;
    }

    x += xSpeed;
    y += ySpeed;

    image.style.left = x + 'px';
    image.style.top = y + 'px';

    if (hitBoundary) {
        setTimeout(changeImage, 50);
    }

    requestAnimationFrame(animate);
}

animate();
