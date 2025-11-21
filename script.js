// Canvas and DOM elements
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const templateGallery = document.getElementById('templateGallery');
const textInput = document.getElementById('textInput');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const textColorInput = document.getElementById('textColor');
const borderColorInput = document.getElementById('borderColor');
const addTextBtn = document.getElementById('addTextBtn');
const positionTopBtn = document.getElementById('positionTopBtn');
const positionBottomBtn = document.getElementById('positionBottomBtn');
const downloadBtn = document.getElementById('downloadBtn');
const textBoxesList = document.getElementById('textBoxesList');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');

// State
let currentImage = null;
let textBoxes = [];
let selectedTextBox = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let isResizing = false;
let resizeHandle = null;
let initialFontSize = 0;
let initialDistance = 0;

// Predefined meme templates from asset folder
const templates = [
    { name: 'Template 1', filename: '2f5eb789172cc659a1958718e4ac155f.jpg' },
    { name: 'Template 2', filename: 'images.jpeg' },
    { name: 'Template 3', filename: 'Unknown.jpeg' },
    { name: 'Template 4', filename: 'Unknown-1.jpeg' },
    { name: 'Template 5', filename: 'Unknown-2.jpeg' },
    { name: 'Template 6', filename: 'Unknown-3.jpeg' },
    { name: 'Template 7', filename: 'Unknown-4.jpeg' },
    { name: 'Template 8', filename: 'Unknown-5.jpeg' }
];

// Initialize
init();

function init() {
    loadTemplates();
    setupEventListeners();
    setupCanvas();
}

function setupCanvas() {
    canvas.width = 800;
    canvas.height = 600;
    if (canvasPlaceholder) {
        canvasPlaceholder.classList.remove('hidden');
    }
    drawCanvas();
}

function loadTemplates() {
    templates.forEach((template, index) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.dataset.index = index;
        
        const img = document.createElement('img');
        img.src = `asset/${template.filename}`;
        img.alt = template.name;
        img.onerror = function() {
            // If image doesn't exist, show placeholder
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="100"%3E%3Crect width="150" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3E' + template.name + '%3C/text%3E%3C/svg%3E';
        };
        
        templateItem.appendChild(img);
        templateItem.addEventListener('click', () => loadTemplate(template.filename));
        templateGallery.appendChild(templateItem);
    });
}

function setupEventListeners() {
    // Image upload
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Text controls
    fontSizeInput.addEventListener('input', (e) => {
        fontSizeValue.textContent = e.target.value + 'px';
        if (selectedTextBox !== null) {
            textBoxes[selectedTextBox].fontSize = parseInt(e.target.value);
            drawCanvas();
        }
    });
    
    textColorInput.addEventListener('input', (e) => {
        if (selectedTextBox !== null) {
            textBoxes[selectedTextBox].textColor = e.target.value;
            drawCanvas();
        }
    });
    
    borderColorInput.addEventListener('input', (e) => {
        if (selectedTextBox !== null) {
            textBoxes[selectedTextBox].borderColor = e.target.value;
            drawCanvas();
        }
    });
    
    addTextBtn.addEventListener('click', addTextBox);
    positionTopBtn.addEventListener('click', () => positionTextBox('top'));
    positionBottomBtn.addEventListener('click', () => positionTextBox('bottom'));
    
    // Download
    downloadBtn.addEventListener('click', downloadMeme);
    
    // Canvas interactions
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            loadImageFromUrl(event.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function loadTemplate(filename) {
    loadImageFromUrl(`asset/${filename}`);
}

function loadImageFromUrl(url) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        currentImage = img;
        // Resize canvas to match image aspect ratio, but limit size
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.add('hidden');
        }
        drawCanvas();
    };
    img.onerror = () => {
        alert('Failed to load image. Please make sure the image file exists.');
    };
    img.src = url;
}

function addTextBox() {
    const text = textInput.value.trim();
    if (!text) {
        alert('Please enter some text');
        return;
    }
    
    if (!currentImage) {
        alert('Please select or upload an image first');
        return;
    }
    
    const fontSize = parseInt(fontSizeInput.value);
    const textColor = textColorInput.value;
    const borderColor = borderColorInput.value;
    
    // Offset new text boxes to prevent overlap
    // Calculate offset based on number of existing text boxes
    const offsetX = (textBoxes.length % 3) * 50 - 50; // -50, 0, 50, -50, 0, 50...
    const offsetY = Math.floor(textBoxes.length / 3) * 60; // 0, 0, 0, 60, 60, 60...
    
    const textBox = {
        id: Date.now(),
        text: text,
        x: canvas.width / 2 + offsetX,
        y: canvas.height / 2 + offsetY,
        fontSize: fontSize,
        textColor: textColor,
        borderColor: borderColor,
        selected: false
    };
    
    textBoxes.push(textBox);
    textInput.value = '';
    selectedTextBox = textBoxes.length - 1;
    updateTextBoxesList();
    drawCanvas();
}

function positionTextBox(position) {
    if (selectedTextBox === null || textBoxes.length === 0) {
        alert('Please add a text box first');
        return;
    }
    
    const textBox = textBoxes[selectedTextBox];
    const padding = 30;
    
    if (position === 'top') {
        textBox.y = padding + textBox.fontSize;
    } else if (position === 'bottom') {
        textBox.y = canvas.height - padding;
    }
    
    drawCanvas();
}

function updateTextBoxesList() {
    textBoxesList.innerHTML = '';
    
    if (textBoxes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = '<p>No text boxes yet</p><p>Add text to get started</p>';
        textBoxesList.appendChild(emptyState);
        return;
    }
    
    textBoxes.forEach((textBox, index) => {
        const item = document.createElement('div');
        item.className = `text-box-item ${index === selectedTextBox ? 'active' : ''}`;
        
        const input = document.createElement('textarea');
        input.value = textBox.text;
        input.placeholder = 'Text content (Press Enter for line breaks)';
        input.rows = 2;
        input.className = 'text-input';
        input.addEventListener('input', (e) => {
            textBox.text = e.target.value;
            drawCanvas();
        });
        
        const controls = document.createElement('div');
        controls.className = 'text-box-controls';
        
        const selectBtn = document.createElement('button');
        selectBtn.textContent = 'Select';
        selectBtn.addEventListener('click', () => {
            selectedTextBox = index;
            fontSizeInput.value = textBox.fontSize;
            fontSizeValue.textContent = textBox.fontSize + 'px';
            textColorInput.value = textBox.textColor || '#ffffff';
            borderColorInput.value = textBox.borderColor || '#000000';
            updateTextBoxesList();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.addEventListener('click', () => {
            textBoxes.splice(index, 1);
            if (selectedTextBox === index) {
                selectedTextBox = null;
            } else if (selectedTextBox > index) {
                selectedTextBox--;
            }
            updateTextBoxesList();
            drawCanvas();
        });
        
        controls.appendChild(selectBtn);
        controls.appendChild(deleteBtn);
        
        item.appendChild(input);
        item.appendChild(controls);
        textBoxesList.appendChild(item);
    });
}

function drawCanvas() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image
    if (currentImage) {
        ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.add('hidden');
        }
    } else {
        if (canvasPlaceholder) {
            canvasPlaceholder.classList.remove('hidden');
        }
    }
    
    // Draw text boxes
    textBoxes.forEach((textBox, index) => {
        drawText(textBox, index === selectedTextBox);
    });
}

function wrapText(text, maxWidth, ctx) {
    // First, split by explicit line breaks (newlines)
    const paragraphs = text.split('\n');
    const lines = [];
    
    paragraphs.forEach((paragraph, paraIndex) => {
        // Skip empty paragraphs (but preserve line breaks)
        if (paraIndex > 0 && paragraph === '' && paragraphs[paraIndex - 1] !== '') {
            lines.push('');
            return;
        }
        
        if (paragraph.trim() === '') {
            if (paraIndex === 0 || paraIndex === paragraphs.length - 1) {
                // Skip leading/trailing empty paragraphs
                return;
            }
            lines.push('');
            return;
        }
        
        // Now wrap each paragraph by words
        const words = paragraph.split(' ');
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && currentLine) {
                // Current line is full, push it and start a new line
                lines.push(currentLine);
                currentLine = word;
                
                // Check if the word itself is too long and needs to be split
                const wordWidth = ctx.measureText(word).width;
                if (wordWidth > maxWidth) {
                    // Split the long word character by character
                    let splitWord = '';
                    for (let j = 0; j < word.length; j++) {
                        const char = word[j];
                        const testCharLine = splitWord + char;
                        const charWidth = ctx.measureText(testCharLine).width;
                        
                        if (charWidth > maxWidth && splitWord) {
                            lines.push(splitWord);
                            splitWord = char;
                        } else {
                            splitWord += char;
                        }
                    }
                    currentLine = splitWord;
                }
            } else {
                currentLine = testLine;
            }
        }
        
        // Push the last line of this paragraph
        if (currentLine) {
            lines.push(currentLine);
        }
    });
    
    return lines;
}

function drawText(textBox, isSelected) {
    ctx.save();
    
    // Set font
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text position
    const x = textBox.x;
    const y = textBox.y;
    
    // Get colors from textBox or use defaults
    const borderColor = textBox.borderColor || '#000000';
    const textColor = textBox.textColor || '#ffffff';
    
    // Calculate max width for text wrapping (80% of canvas width with padding)
    const maxWidth = (canvas.width * 0.8) - 40;
    const lineHeight = textBox.fontSize * 1.2;
    
    // Wrap text into multiple lines
    const lines = wrapText(textBox.text, maxWidth, ctx);
    
    // Calculate total text height
    const totalHeight = lines.length * lineHeight;
    const startY = y - (totalHeight / 2) + (lineHeight / 2);
    
    // Draw text with customizable stroke (border) and fill
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = Math.max(2, textBox.fontSize / 20);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    // Draw each line
    lines.forEach((line, index) => {
        const lineY = startY + (index * lineHeight);
        
        // Draw stroke (border) multiple times for thicker border
        for (let i = 0; i < 3; i++) {
            ctx.strokeText(line, x, lineY);
        }
        
        // Draw text fill with customizable color
        ctx.fillStyle = textColor;
        ctx.fillText(line, x, lineY);
    });
    
    // Draw selection indicator and resize handles
    if (isSelected) {
        // Calculate the maximum width of all lines
        let maxLineWidth = 0;
        lines.forEach(line => {
            const metrics = ctx.measureText(line);
            if (metrics.width > maxLineWidth) {
                maxLineWidth = metrics.width;
            }
        });
        
        const textWidth = maxLineWidth;
        const textHeight = totalHeight;
        const padding = 10;
        
        const rectX = x - textWidth / 2 - padding;
        const rectY = y - textHeight / 2 - padding;
        const rectWidth = textWidth + padding * 2;
        const rectHeight = textHeight + padding * 2;
        
        // Draw selection border
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
        ctx.setLineDash([]);
        
        // Draw resize handles
        const handleSize = 12;
        const handleHalf = handleSize / 2;
        ctx.fillStyle = '#667eea';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Calculate and draw resize handles
        const handles = calculateResizeHandles(textBox);
        
        // Draw corner handles (more prominent)
        const cornerHandles = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
        cornerHandles.forEach(handleName => {
            const handle = handles[handleName];
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handleHalf, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    ctx.restore();
}

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    };
}

function isPointInTextBox(x, y, textBox) {
    ctx.save();
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate max width for text wrapping (same as in drawText)
    const maxWidth = (canvas.width * 0.8) - 40;
    const lineHeight = textBox.fontSize * 1.2;
    
    // Wrap text into multiple lines
    const lines = wrapText(textBox.text, maxWidth, ctx);
    
    // Calculate the maximum width of all lines
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
        }
    });
    
    const textWidth = maxLineWidth;
    const textHeight = lines.length * lineHeight;
    const padding = 15;
    ctx.restore();
    
    return (
        x >= textBox.x - textWidth / 2 - padding &&
        x <= textBox.x + textWidth / 2 + padding &&
        y >= textBox.y - textHeight / 2 - padding &&
        y <= textBox.y + textHeight / 2 + padding
    );
}

function calculateResizeHandles(textBox) {
    ctx.save();
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const maxWidth = (canvas.width * 0.8) - 40;
    const lineHeight = textBox.fontSize * 1.2;
    const lines = wrapText(textBox.text, maxWidth, ctx);
    
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) {
            maxLineWidth = metrics.width;
        }
    });
    
    const textWidth = maxLineWidth;
    const textHeight = lines.length * lineHeight;
    const padding = 10;
    
    const x = textBox.x;
    const y = textBox.y;
    const rectX = x - textWidth / 2 - padding;
    const rectY = y - textHeight / 2 - padding;
    const rectWidth = textWidth + padding * 2;
    const rectHeight = textHeight + padding * 2;
    
    ctx.restore();
    
    return {
        topLeft: { x: rectX, y: rectY },
        topRight: { x: rectX + rectWidth, y: rectY },
        bottomLeft: { x: rectX, y: rectY + rectHeight },
        bottomRight: { x: rectX + rectWidth, y: rectY + rectHeight },
        top: { x: rectX + rectWidth / 2, y: rectY },
        bottom: { x: rectX + rectWidth / 2, y: rectY + rectHeight },
        left: { x: rectX, y: rectY + rectHeight / 2 },
        right: { x: rectX + rectWidth, y: rectY + rectHeight / 2 }
    };
}

function getResizeHandle(x, y, textBox) {
    const handles = calculateResizeHandles(textBox);
    const handleRadius = 10;
    
    for (const [handleName, handlePos] of Object.entries(handles)) {
        const distance = Math.sqrt(
            Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2)
        );
        if (distance <= handleRadius) {
            return handleName;
        }
    }
    
    return null;
}

function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function handleMouseDown(e) {
    const pos = getMousePos(e);
    
    // First check if clicking on a resize handle
    if (selectedTextBox !== null) {
        const textBox = textBoxes[selectedTextBox];
        const handle = getResizeHandle(pos.x, pos.y, textBox);
        if (handle) {
            isResizing = true;
            resizeHandle = handle;
            initialFontSize = textBox.fontSize;
            initialDistance = calculateDistance(pos.x, pos.y, textBox.x, textBox.y);
            canvas.style.cursor = getResizeCursor(handle);
            return;
        }
    }
    
    // Check if clicking on a text box
    for (let i = textBoxes.length - 1; i >= 0; i--) {
        if (isPointInTextBox(pos.x, pos.y, textBoxes[i])) {
            selectedTextBox = i;
            const textBox = textBoxes[i];
            fontSizeInput.value = textBox.fontSize;
            fontSizeValue.textContent = textBox.fontSize + 'px';
            textColorInput.value = textBox.textColor || '#ffffff';
            borderColorInput.value = textBox.borderColor || '#000000';
            isDragging = true;
            dragOffset.x = pos.x - textBox.x;
            dragOffset.y = pos.y - textBox.y;
            updateTextBoxesList();
            drawCanvas();
            return;
        }
    }
    
    // If not clicking on text box, deselect
    selectedTextBox = null;
    updateTextBoxesList();
    drawCanvas();
}

function getResizeCursor(handle) {
    const cursors = {
        'topLeft': 'nw-resize',
        'topRight': 'ne-resize',
        'bottomLeft': 'sw-resize',
        'bottomRight': 'se-resize',
        'top': 'n-resize',
        'bottom': 's-resize',
        'left': 'w-resize',
        'right': 'e-resize'
    };
    return cursors[handle] || 'default';
}

function handleMouseMove(e) {
    const pos = getMousePos(e);
    
    // Handle resizing
    if (isResizing && selectedTextBox !== null && resizeHandle) {
        const textBox = textBoxes[selectedTextBox];
        const currentDistance = calculateDistance(pos.x, pos.y, textBox.x, textBox.y);
        const scaleFactor = currentDistance / initialDistance;
        const newFontSize = Math.round(initialFontSize * scaleFactor);
        
        // Clamp font size between min and max
        const minFontSize = 10;
        const maxFontSize = 150;
        textBox.fontSize = Math.max(minFontSize, Math.min(maxFontSize, newFontSize));
        
        // Update the slider to match
        fontSizeInput.value = textBox.fontSize;
        fontSizeValue.textContent = textBox.fontSize + 'px';
        
        drawCanvas();
        return;
    }
    
    // Update cursor when hovering over resize handles
    if (selectedTextBox !== null && !isDragging && !isResizing) {
        const textBox = textBoxes[selectedTextBox];
        const handle = getResizeHandle(pos.x, pos.y, textBox);
        if (handle) {
            canvas.style.cursor = getResizeCursor(handle);
            return;
        } else {
            canvas.style.cursor = 'default';
        }
    }
    
    // Handle dragging
    if (isDragging && selectedTextBox !== null) {
        textBoxes[selectedTextBox].x = pos.x - dragOffset.x;
        textBoxes[selectedTextBox].y = pos.y - dragOffset.y;
        
        // Keep text within canvas bounds
        textBoxes[selectedTextBox].x = Math.max(0, Math.min(canvas.width, textBoxes[selectedTextBox].x));
        textBoxes[selectedTextBox].y = Math.max(0, Math.min(canvas.height, textBoxes[selectedTextBox].y));
        
        drawCanvas();
    }
}

function handleMouseUp(e) {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
    canvas.style.cursor = 'default';
}

function handleTouchStart(e) {
    e.preventDefault();
    const pos = getTouchPos(e);
    const rect = canvas.getBoundingClientRect();
    const mouseEvent = {
        clientX: pos.x + rect.left,
        clientY: pos.y + rect.top
    };
    handleMouseDown(mouseEvent);
}

function handleTouchMove(e) {
    e.preventDefault();
    if (isDragging || isResizing) {
        const pos = getTouchPos(e);
        const rect = canvas.getBoundingClientRect();
        const mouseEvent = {
            clientX: pos.x + rect.left,
            clientY: pos.y + rect.top
        };
        handleMouseMove(mouseEvent);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    handleMouseUp(e);
}

function downloadMeme() {
    if (!currentImage && textBoxes.length === 0) {
        alert('Please add an image and text to create a meme');
        return;
    }
    
    // Create download link
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = dataURL;
    link.click();
}
