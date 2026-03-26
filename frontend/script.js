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

// Random placement + drag for tech stack chips (mouse and touch via pointer events)
const stackCanvas = document.querySelector('#stack ul');
const stackChips = Array.from(document.querySelectorAll('#stack li'));

const toPxNumber = (value) => parseFloat(String(value || '').replace('px', '')) || 0;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const chipGap = 8;

const rectsOverlap = (a, b) => (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
);

const getChipRectAt = (chip, left, top) => ({
    left: left - chipGap,
    top: top - chipGap,
    right: left + chip.offsetWidth + chipGap,
    bottom: top + chip.offsetHeight + chipGap
});

const getChipBasePosition = (chip) => ({
    x: toPxNumber(getComputedStyle(chip).getPropertyValue('--x')),
    y: toPxNumber(getComputedStyle(chip).getPropertyValue('--y'))
});

const getChipMoveOffset = (chip) => ({
    tx: toPxNumber(getComputedStyle(chip).getPropertyValue('--tx')),
    ty: toPxNumber(getComputedStyle(chip).getPropertyValue('--ty'))
});

const collidesWithOtherChip = (chip, left, top) => {
    const nextRect = getChipRectAt(chip, left, top);

    return stackChips.some((otherChip) => {
        if (otherChip === chip) return false;

        const otherBase = getChipBasePosition(otherChip);
        const otherMove = getChipMoveOffset(otherChip);
        const otherRect = getChipRectAt(
            otherChip,
            otherBase.x + otherMove.tx,
            otherBase.y + otherMove.ty
        );

        return rectsOverlap(nextRect, otherRect);
    });
};

if (stackCanvas && stackChips.length) {
    requestAnimationFrame(() => {
        // Place chips in random non-overlapping positions.
        const placedRects = [];
        stackChips.forEach((chip) => {
            const maxX = Math.max(0, stackCanvas.clientWidth - chip.offsetWidth - 8);
            const maxY = Math.max(0, stackCanvas.clientHeight - chip.offsetHeight - 8);
            let x = 0;
            let y = 0;
            let foundSpot = false;

            for (let attempt = 0; attempt < 400; attempt += 1) {
                const candidateX = Math.random() * maxX;
                const candidateY = Math.random() * maxY;
                const candidateRect = getChipRectAt(chip, candidateX, candidateY);

                const overlapFound = placedRects.some((placedRect) => rectsOverlap(candidateRect, placedRect));
                if (!overlapFound) {
                    x = candidateX;
                    y = candidateY;
                    placedRects.push(candidateRect);
                    foundSpot = true;
                    break;
                }
            }

            if (!foundSpot) {
                const fallbackRect = getChipRectAt(chip, x, y);
                placedRects.push(fallbackRect);
            }

            chip.style.setProperty('--x', `${x}px`);
            chip.style.setProperty('--y', `${y}px`);
        });

        stackChips.forEach((chip) => {
            chip.classList.add('draggable-chip');

            const initialTx = chip.dataset.tx || '0px';
            const initialTy = chip.dataset.ty || '0px';
            chip.style.setProperty('--tx', initialTx);
            chip.style.setProperty('--ty', initialTy);

            let startX = 0;
            let startY = 0;
            let baseTx = 0;
            let baseTy = 0;
            let basePosX = 0;
            let basePosY = 0;
            let dragging = false;

            chip.addEventListener('pointerdown', (e) => {
                dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                baseTx = toPxNumber(chip.dataset.tx);
                baseTy = toPxNumber(chip.dataset.ty);
                basePosX = toPxNumber(getComputedStyle(chip).getPropertyValue('--x'));
                basePosY = toPxNumber(getComputedStyle(chip).getPropertyValue('--y'));
                chip.classList.add('is-dragging');
                chip.setPointerCapture(e.pointerId);
            });

            chip.addEventListener('pointermove', (e) => {
                if (!dragging) return;

                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const currentTx = toPxNumber(getComputedStyle(chip).getPropertyValue('--tx'));
                const currentTy = toPxNumber(getComputedStyle(chip).getPropertyValue('--ty'));
                const minTx = -basePosX;
                const maxTx = stackCanvas.clientWidth - chip.offsetWidth - basePosX;
                const minTy = -basePosY;
                const maxTy = stackCanvas.clientHeight - chip.offsetHeight - basePosY;

                const nextTx = clamp(baseTx + dx, minTx, maxTx);
                const nextTy = clamp(baseTy + dy, minTy, maxTy);
                const nextLeft = basePosX + nextTx;
                const nextTop = basePosY + nextTy;

                if (!collidesWithOtherChip(chip, nextLeft, nextTop)) {
                    chip.style.setProperty('--tx', `${nextTx}px`);
                    chip.style.setProperty('--ty', `${nextTy}px`);
                    return;
                }

                const nextLeftXOnly = basePosX + nextTx;
                const nextTopXOnly = basePosY + currentTy;
                if (!collidesWithOtherChip(chip, nextLeftXOnly, nextTopXOnly)) {
                    chip.style.setProperty('--tx', `${nextTx}px`);
                    chip.style.setProperty('--ty', `${currentTy}px`);
                    return;
                }

                const nextLeftYOnly = basePosX + currentTx;
                const nextTopYOnly = basePosY + nextTy;
                if (!collidesWithOtherChip(chip, nextLeftYOnly, nextTopYOnly)) {
                    chip.style.setProperty('--tx', `${currentTx}px`);
                    chip.style.setProperty('--ty', `${nextTy}px`);
                }
            });

            const stopDragging = (e) => {
                if (!dragging) return;
                dragging = false;

                const finalX = toPxNumber(getComputedStyle(chip).getPropertyValue('--tx'));
                const finalY = toPxNumber(getComputedStyle(chip).getPropertyValue('--ty'));
                chip.dataset.tx = `${finalX}`;
                chip.dataset.ty = `${finalY}`;
                chip.classList.remove('is-dragging');

                if (chip.hasPointerCapture(e.pointerId)) {
                    chip.releasePointerCapture(e.pointerId);
                }
            };

            chip.addEventListener('pointerup', stopDragging);
            chip.addEventListener('pointercancel', stopDragging);
        });
    });
}

