// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Contact form AJAX submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const formStatus = document.getElementById('formStatus');
        formStatus.textContent = 'Sending...';
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        try {
            const res = await fetch('http://localhost:3001/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message })
            });
            const data = await res.json();
            if (data.success) {
                formStatus.textContent = 'Message sent successfully!';
                contactForm.reset();
            } else {
                formStatus.textContent = data.error || 'Failed to send message.';
            }
        } catch (err) {
            formStatus.textContent = 'Failed to send message.';
        }
    });
}

// Mouse/touch drag rotation for the 3D tech stack cube
const cubeScene = document.querySelector('.cube-scene');
const stackCube = document.querySelector('.stack-cube');

if (cubeScene && stackCube) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let rotateX = -16;
    let rotateY = 22;
    let velocityX = 0;
    let velocityY = 0;
    let lastMoveTime = 0;
    let inertiaRafId = null;
    const sensitivity = 0.32;
    const friction = 0.94;
    const minVelocity = 0.015;

    const applyRotation = () => {
        stackCube.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const stopInertia = () => {
        if (inertiaRafId !== null) {
            cancelAnimationFrame(inertiaRafId);
            inertiaRafId = null;
            cubeScene.classList.remove('is-inertia');
        }
    };

    const startInertia = () => {
        stopInertia();
        cubeScene.classList.add('is-inertia');

        const step = () => {
            rotateY += velocityY;
            rotateX += velocityX;

            if (rotateX > 80) {
                rotateX = 80;
                velocityX = 0;
            } else if (rotateX < -80) {
                rotateX = -80;
                velocityX = 0;
            }

            applyRotation();

            velocityX *= friction;
            velocityY *= friction;

            if (Math.abs(velocityX) < minVelocity && Math.abs(velocityY) < minVelocity) {
                stopInertia();
                return;
            }

            inertiaRafId = requestAnimationFrame(step);
        };

        inertiaRafId = requestAnimationFrame(step);
    };

    applyRotation();

    cubeScene.addEventListener('pointerdown', (e) => {
        stopInertia();
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        lastMoveTime = performance.now();
        velocityX = 0;
        velocityY = 0;
        cubeScene.classList.add('is-dragging');
        cubeScene.setPointerCapture(e.pointerId);
    });

    cubeScene.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        rotateY += dx * sensitivity;
        rotateX -= dy * sensitivity;
        rotateX = Math.max(-80, Math.min(80, rotateX));

        const now = performance.now();
        const dt = Math.max(1, now - lastMoveTime);
        velocityY = (dx * sensitivity) / (dt / 16.67);
        velocityX = (-dy * sensitivity) / (dt / 16.67);
        lastMoveTime = now;

        applyRotation();

        startX = e.clientX;
        startY = e.clientY;
    });

    const stopDragging = (e) => {
        if (!isDragging) return;

        isDragging = false;
        cubeScene.classList.remove('is-dragging');

        if (cubeScene.hasPointerCapture(e.pointerId)) {
            cubeScene.releasePointerCapture(e.pointerId);
        }

        if (Math.abs(velocityX) >= minVelocity || Math.abs(velocityY) >= minVelocity) {
            startInertia();
        }
    };

    cubeScene.addEventListener('pointerup', stopDragging);
    cubeScene.addEventListener('pointercancel', stopDragging);
}
