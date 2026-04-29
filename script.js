document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadContent = document.getElementById('uploadContent');
    const generateBtn = document.getElementById('generateBtn');
    const promptInput = document.getElementById('promptInput');

    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    const resultView = document.getElementById('resultView');

    const progressFill = document.getElementById('progressFill');
    const loadingText = document.querySelector('.loading-text');

    // Auth Elements
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const userProfile = document.getElementById('userProfile');
    const signInModal = document.getElementById('signInModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const emailInput = document.getElementById('emailInput');
    const userNameDisplay = document.getElementById('userNameDisplay');

    // Editing Elements
    const editingToolbar = document.getElementById('editingToolbar');
    const editContainer = document.getElementById('editContainer');
    const editImage = document.getElementById('editImage');
    const cropToolBtn = document.getElementById('cropToolBtn');
    const eraserToolBtn = document.getElementById('eraserToolBtn');
    const filterToolBtn = document.getElementById('filterToolBtn');
    const filterOptions = document.getElementById('filterOptions');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const applyEditBtn = document.getElementById('applyEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const eraserCanvas = document.getElementById('eraserCanvas');

    let userImageUrl = null;
    let currentUser = localStorage.getItem('aiEditorUser');
    let cropper = null;
    let currentMode = null; // 'crop', 'erase', or 'filter'
    let selectedFilter = 'none';
    let isDrawing = false;
    let ctx = eraserCanvas.getContext('2d');

    // Auth Logic
    function updateAuthUI() {
        if (currentUser) {
            signInBtn.classList.add('hidden');
            userProfile.classList.remove('hidden');
            userNameDisplay.textContent = currentUser.split('@')[0];
        } else {
            signInBtn.classList.remove('hidden');
            userProfile.classList.add('hidden');
        }
    }

    updateAuthUI();

    signInBtn.addEventListener('click', () => signInModal.classList.remove('hidden'));
    closeModalBtn.addEventListener('click', () => signInModal.classList.add('hidden'));

    loginSubmitBtn.addEventListener('click', () => {
        if (emailInput.value) {
            currentUser = emailInput.value;
            localStorage.setItem('aiEditorUser', currentUser);
            signInModal.classList.add('hidden');
            updateAuthUI();
        }
    });

    signOutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('aiEditorUser');
        updateAuthUI();
    });

    // Upload Logic
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                userImageUrl = e.target.result;
                // Initialize Editing Mode
                uploadArea.classList.add('hidden');
                editingToolbar.classList.remove('hidden');
                editContainer.classList.remove('hidden');
                editImage.src = userImageUrl;

                if (!promptInput.value) {
                    promptInput.value = "Transform this image with beautiful cinematic lighting";
                }
            };
            reader.readAsDataURL(file);
        }
    }

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Editing Logic
    function resetEditTools() {
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        eraserCanvas.classList.add('hidden');
        filterOptions.classList.add('hidden');
        editImage.style.filter = "none";
        cropToolBtn.classList.remove('active');
        eraserToolBtn.classList.remove('active');
        filterToolBtn.classList.remove('active');
        applyEditBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');

        filterBtns.forEach(btn => btn.classList.remove('active'));
        if (filterBtns[0]) filterBtns[0].classList.add('active');
        selectedFilter = 'none';

        currentMode = null;
    }

    cropToolBtn.addEventListener('click', () => {
        resetEditTools();
        currentMode = 'crop';
        cropToolBtn.classList.add('active');
        applyEditBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

        cropper = new Cropper(editImage, {
            viewMode: 1,
            autoCropArea: 1,
        });
    });

    eraserToolBtn.addEventListener('click', () => {
        resetEditTools();
        currentMode = 'erase';
        eraserToolBtn.classList.add('active');
        applyEditBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');

        // Setup Eraser Canvas
        eraserCanvas.classList.remove('hidden');
        const rect = editImage.getBoundingClientRect();
        eraserCanvas.width = rect.width;
        eraserCanvas.height = rect.height;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 20;
        ctx.filter = 'blur(4px)'; // Simulate healing brush
    });

    filterToolBtn.addEventListener('click', () => {
        resetEditTools();
        currentMode = 'filter';
        filterToolBtn.classList.add('active');
        filterOptions.classList.remove('hidden');
        applyEditBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedFilter = btn.getAttribute('data-filter');
            editImage.style.filter = selectedFilter;
        });
    });

    // Drawing Logic for Eraser
    eraserCanvas.addEventListener('mousedown', startDrawing);
    eraserCanvas.addEventListener('mousemove', draw);
    eraserCanvas.addEventListener('mouseup', stopDrawing);
    eraserCanvas.addEventListener('mouseout', stopDrawing);

    // Touch support for eraser
    eraserCanvas.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startDrawing(mouseEvent);
    });
    eraserCanvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        draw(mouseEvent);
    }, { passive: false });
    eraserCanvas.addEventListener('touchend', stopDrawing);

    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!isDrawing || currentMode !== 'erase') return;
        const rect = eraserCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Draw with surrounding pixel color simulation
        // To simulate a simple magic eraser, we just draw with a blurred semi-transparent white/gray
        ctx.lineTo(x, y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // basic smudge effect
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    function stopDrawing() {
        isDrawing = false;
        ctx.beginPath();
    }

    cancelEditBtn.addEventListener('click', resetEditTools);

    applyEditBtn.addEventListener('click', () => {
        if (currentMode === 'crop' && cropper) {
            userImageUrl = cropper.getCroppedCanvas().toDataURL('image/jpeg');
            editImage.src = userImageUrl;
        } else if (currentMode === 'erase') {
            // Merge canvas onto image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = eraserCanvas.width;
            tempCanvas.height = eraserCanvas.height;
            const tCtx = tempCanvas.getContext('2d');
            tCtx.drawImage(editImage, 0, 0, tempCanvas.width, tempCanvas.height);
            tCtx.drawImage(eraserCanvas, 0, 0);
            userImageUrl = tempCanvas.toDataURL('image/jpeg');
            editImage.src = userImageUrl;
        } else if (currentMode === 'filter' && selectedFilter !== 'none') {
            // Bake the filter into the image
            const tempCanvas = document.createElement('canvas');
            const img = new Image();
            img.onload = () => {
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tCtx = tempCanvas.getContext('2d');
                tCtx.filter = selectedFilter;
                tCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
                userImageUrl = tempCanvas.toDataURL('image/jpeg');
                editImage.src = userImageUrl;
                resetEditTools();
            };
            img.src = userImageUrl;
            return; // Exit early since it's async
        }
        resetEditTools();
    });

    // Generation Flow
    generateBtn.addEventListener('click', () => {
        if (!currentUser) {
            signInModal.classList.remove('hidden');
            return;
        }

        if (!promptInput.value) {
            alert("Please enter a transformation prompt.");
            return;
        }

        // Apply any pending edits
        if (currentMode) {
            applyEditBtn.click();
        }

        // Show loading state
        emptyState.classList.add('hidden');
        resultView.classList.add('hidden');
        loadingState.classList.remove('hidden');

        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.5';

        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) progress = 90; // Wait for real image
            progressFill.style.width = `${progress}%`;
        }, 300);

        // Fetch real AI image from pollinations.ai
        const encodedPrompt = encodeURIComponent(promptInput.value + " masterpiece, high quality, highly detailed");
        const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            clearInterval(interval);
            progressFill.style.width = `100%`;
            setTimeout(() => {
                showResult(img.src);
            }, 500);
        };
        img.onerror = () => {
            clearInterval(interval);
            alert("Error generating image. Please try again.");
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
        };
        img.src = aiImageUrl;
    });

    function showResult(aiImageUrl) {
        loadingState.classList.add('hidden');
        resultView.classList.remove('hidden');
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        generateBtn.innerHTML = `
            <span>Generate Again</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        `;

        const beforeImage = document.getElementById('beforeImage');
        const afterImage = document.getElementById('afterImage');

        if (userImageUrl) {
            beforeImage.src = userImageUrl;
        } else {
            beforeImage.src = "assets/original.png";
        }

        // Remove any old filters
        afterImage.style.filter = "none";
        afterImage.src = aiImageUrl;

        initSlider();
    }

    // Comparison Slider Logic
    function initSlider() {
        const slider = document.querySelector('.comparison-slider');
        const handle = document.querySelector('.slider-handle');
        const beforeWrapper = document.querySelector('.before-image-wrapper');

        let isSliding = false;

        const startSlide = (e) => { isSliding = true; };
        const stopSlide = () => { isSliding = false; };

        const doSlide = (x) => {
            if (!isSliding) return;
            const rect = slider.getBoundingClientRect();
            x = Math.max(0, Math.min(x - rect.left, rect.width));
            const percent = (x / rect.width) * 100;
            handle.style.left = `${percent}%`;
            beforeWrapper.style.width = `${percent}%`;
        };

        handle.addEventListener('mousedown', startSlide);
        window.addEventListener('mouseup', stopSlide);
        window.addEventListener('mousemove', (e) => doSlide(e.clientX));

        handle.addEventListener('touchstart', startSlide);
        window.addEventListener('touchend', stopSlide);
        window.addEventListener('touchmove', (e) => doSlide(e.touches[0].clientX));
    }
});
