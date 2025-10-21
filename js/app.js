// PDF.js Configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Application State
const state = {
    pdfDoc: null,
    pageNum: 1,
    pageCount: 0,
    scale: 1.5,
    rendering: false,
    pageRendering: false,
    fileName: ''
};

// DOM Elements
const elements = {
    canvas: document.getElementById('pdfCanvas'),
    pageInfo: document.getElementById('pageInfo'),
    pageInfoMobile: document.getElementById('pageInfoMobile'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    welcomeScreen: document.getElementById('welcomeScreen'),
    pdfContainer: document.getElementById('pdfContainer'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    // Mobile elements
    prevPageMobile: document.getElementById('prevPageMobile'),
    nextPageMobile: document.getElementById('nextPageMobile')
};

// Utility Functions
const showLoading = () => {
    elements.loadingSpinner.style.display = 'flex';
    elements.pdfContainer.style.display = 'none';
    elements.welcomeScreen.style.display = 'none';
};

const hideLoading = () => {
    elements.loadingSpinner.style.display = 'none';
    elements.pdfContainer.style.display = 'block';
};

const updateUI = () => {
    const pageText = `Page ${state.pageNum} of ${state.pageCount}`;
    elements.pageInfo.textContent = pageText;
    if (elements.pageInfoMobile) {
        elements.pageInfoMobile.textContent = pageText;
    }
    
    // Update button states
    const prevDisabled = state.pageNum <= 1;
    const nextDisabled = state.pageNum >= state.pageCount;
    
    elements.prevPage.disabled = prevDisabled;
    elements.nextPage.disabled = nextDisabled;
    elements.prevPageMobile.disabled = prevDisabled;
    elements.nextPageMobile.disabled = nextDisabled;
};

// Render PDF Page
const renderPage = async (num) => {
    if (state.pageRendering) {
        return;
    }
    
    state.pageRendering = true;
    
    try {
        const page = await state.pdfDoc.getPage(num);
        const viewport = page.getViewport({ scale: state.scale });
        
        const canvas = elements.canvas;
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        state.pageNum = num;
        updateUI();
    } catch (error) {
        console.error('Error rendering page:', error);
        alert('Error rendering page. Please try again.');
    } finally {
        state.pageRendering = false;
    }
};

// Load PDF Document
const loadPDF = async (file) => {
    showLoading();
    
    try {
        const fileReader = new FileReader();
        
        fileReader.onload = async (e) => {
            try {
                const typedArray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument(typedArray).promise;
                
                state.pdfDoc = pdf;
                state.pageCount = pdf.numPages;
                state.pageNum = 1;
                state.fileName = file.name;
                
                hideLoading();
                await renderPage(state.pageNum);
                
                // Add fade-in animation
                elements.pdfContainer.classList.add('fade-in');
            } catch (error) {
                console.error('Error loading PDF:', error);
                alert('Error loading PDF. Please make sure the file is a valid PDF.');
                elements.loadingSpinner.style.display = 'none';
                elements.welcomeScreen.style.display = 'flex';
            }
        };
        
        fileReader.readAsArrayBuffer(file);
    } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
        elements.loadingSpinner.style.display = 'none';
        elements.welcomeScreen.style.display = 'flex';
    }
};

// Navigation Functions
const showPrevPage = () => {
    if (state.pageNum <= 1) return;
    renderPage(state.pageNum - 1);
};

const showNextPage = () => {
    if (state.pageNum >= state.pageCount) return;
    renderPage(state.pageNum + 1);
};

// Event Listeners

// Navigation
elements.prevPage.addEventListener('click', showPrevPage);
elements.nextPage.addEventListener('click', showNextPage);
elements.prevPageMobile.addEventListener('click', showPrevPage);
elements.nextPageMobile.addEventListener('click', showNextPage);

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (!state.pdfDoc) return;
    
    switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
            e.preventDefault();
            showPrevPage();
            break;
        case 'ArrowRight':
        case 'ArrowDown':
            e.preventDefault();
            showNextPage();
            break;
    }
});

// Window Resize Handler
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (state.pdfDoc) {
            renderPage(state.pageNum);
        }
    }, 250);
});

// Auto-load PDF on page load
const autoLoadPDF = async () => {
    const pdfPath = 'ravencare.pdf';
    
    try {
        showLoading();
        const loadingTask = pdfjsLib.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        
        state.pdfDoc = pdf;
        state.pageCount = pdf.numPages;
        state.pageNum = 1;
        state.fileName = 'ravencare.pdf';
        
        hideLoading();
        await renderPage(state.pageNum);
        
        // Add fade-in animation
        elements.pdfContainer.classList.add('fade-in');
    } catch (error) {
        console.error('Error loading PDF:', error);
        // Show welcome screen if auto-load fails
        elements.loadingSpinner.style.display = 'none';
        elements.welcomeScreen.style.display = 'flex';
    }
};

// Initialize
updateUI();
autoLoadPDF();
console.log('RavenCare PDF Viewer initialized successfully!');
