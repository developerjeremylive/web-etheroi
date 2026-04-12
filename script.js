const AI_CONFIG = {
    endpoint: 'http://localhost:3000/api/chat',
    model: 'gemma-4-31b-it'
};

document.addEventListener('DOMContentLoaded', () => {
    const htmlElement = document.documentElement;
    // Three.js Background Animation
    function initBackground() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        camera.position.z = 5;

        // --- Constellation Logic ---
        const particleCount = 150;
        const maxDistance = 1.5;
        const speed = 0.01;
        const bounds = { x: 10, y: 10, z: 10 };

        const particles = [];
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * bounds.x;
            const y = (Math.random() - 0.5) * bounds.y;
            const z = (Math.random() - 0.5) * bounds.z;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            velocities[i * 3] = (Math.random() - 0.5) * speed;
            velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x888888,
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });

        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particleSystem);

        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.2
        });

        const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lineSystem);

        // --- Theme Synchronization ---
        const updateThemeColors = (theme) => {
            const isDark = theme === 'dark';
            const color = isDark ? 0xe28d6c : 0x888888; // Use accent color for dark mode
            const opacity = isDark ? 0.8 : 0.6;
            const lineOpacity = isDark ? 0.4 : 0.2;

            particleMaterial.color.setHex(color);
            particleMaterial.opacity = opacity;
            lineMaterial.color.setHex(color);
            lineMaterial.opacity = lineOpacity;
        };

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    updateThemeColors(htmlElement.getAttribute('data-theme'));
                }
            });
        });

        observer.observe(htmlElement, { attributes: true });
        updateThemeColors(htmlElement.getAttribute('data-theme'));

        // --- Window Resize Handling ---
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // --- Mouse Interaction ---
        const mouse = { x: 0, y: 0 };
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        function animate() {
            requestAnimationFrame(animate);

            const posAttr = particleGeometry.attributes.position;
            const linePositions = [];

            // Convert mouse normalized coordinates to 3D world space (approximate)
            const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distance = -camera.position.z / dir.z;
            const mouseWorldPos = camera.position.clone().add(dir.multiplyScalar(distance));

            for (let i = 0; i < particleCount; i++) {
                const ix = i * 3;
                const iy = i * 3 + 1;
                const iz = i * 3 + 2;

                // Update positions
                posAttr.array[ix] += velocities[ix];
                posAttr.array[iy] += velocities[iy];
                posAttr.array[iz] += velocities[iz];

                // Mouse repulsion logic
                const dx = posAttr.array[ix] - mouseWorldPos.x;
                const dy = posAttr.array[iy] - mouseWorldPos.y;
                const dz = posAttr.array[iz] - mouseWorldPos.z;
                const distSq = dx * dx + dy * dy + dz * dz;
                if (distSq < 2) {
                    const force = (2 - distSq) * 0.001;
                    velocities[ix] += dx * force;
                    velocities[iy] += dy * force;
                    velocities[iz] += dz * force;
                }

                // Bounce boundaries
                if (Math.abs(posAttr.array[ix]) > bounds.x / 2) velocities[ix] *= -1;
                if (Math.abs(posAttr.array[iy]) > bounds.y / 2) velocities[iy] *= -1;
                if (Math.abs(posAttr.array[iz]) > bounds.z / 2) velocities[iz] *= -1;

                // Check distance with other particles
                for (let j = i + 1; j < particleCount; j++) {
                    const jx = j * 3;
                    const jy = j * 3 + 1;
                    const jz = j * 3 + 2;
                    const ddx = posAttr.array[ix] - posAttr.array[jx];
                    const ddy = posAttr.array[iy] - posAttr.array[jy];
                    const ddz = posAttr.array[iz] - posAttr.array[jz];
                    const dDistSq = ddx * ddx + ddy * ddy + ddz * ddz;

                    if (dDistSq < maxDistance * maxDistance) {
                        linePositions.push(
                            posAttr.array[ix], posAttr.array[iy], posAttr.array[iz],
                            posAttr.array[jx], posAttr.array[jy], posAttr.array[jz]
                        );
                    }
                }
            }

            posAttr.needsUpdate = true;
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

            renderer.render(scene, camera);
        }

        animate();
    }


    initBackground();

    // Theme Toggle Logic

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-toggle-icon');

    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });

    const carousels = document.querySelectorAll('.carousel-container');

    carousels.forEach(carousel => {
        const grid = carousel.querySelector('.grid');
        const nextBtn = carousel.querySelector('.carousel-nav.next');
        const prevBtn = carousel.querySelector('.carousel-nav.prev');

        if (!grid || !nextBtn || !prevBtn) return;

        const firstCard = grid.querySelector('.project-card');
        const scrollAmount = firstCard ? firstCard.offsetWidth + parseFloat(getComputedStyle(grid).gap || 0) : 340;

        // Manual Navigation
        nextBtn.addEventListener('click', () => {
            grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        // Auto-scroll logic
        let autoScrollTimer = setInterval(() => {
            const maxScrollLeft = grid.scrollWidth - grid.clientWidth;

            if (grid.scrollLeft >= maxScrollLeft - 1) {
                // Reset to beginning if at the end
                grid.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }, 3000);

        // Pause auto-scroll on user interaction
        const pauseAutoScroll = () => clearInterval(autoScrollTimer);

        grid.addEventListener('mousedown', pauseAutoScroll);
        grid.addEventListener('touchstart', pauseAutoScroll);
        nextBtn.addEventListener('mousedown', pauseAutoScroll);
        prevBtn.addEventListener('mousedown', pauseAutoScroll);
});

    // AI Chatbot Logic
    const chatFab = document.getElementById('ai-chat-fab');
    const chatContainer = document.getElementById('ai-chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    chatFab.addEventListener('click', () => {
        chatContainer.classList.remove('hidden');
    });

    closeChat.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
    });

    const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);

        if (sender === 'user') {
            msgDiv.textContent = text;
        } else {
            // For AI, we initially set text or leave empty for rich rendering
            msgDiv.textContent = text;
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv;
    };

    const processAIResponse = (text, element) => {
        // 1. Handle Thinking Block
        const thoughtRegex = /<thought>([\s\S]*?)<\/thought>/;
        const match = text.match(thoughtRegex);
        let finalContent = text;

        if (match) {
            const thinkingText = match[1].trim();
            const thinkingDiv = document.createElement('div');
            thinkingDiv.classList.add('thinking-block');
            thinkingDiv.innerHTML = marked.parse(thinkingText);
            element.appendChild(thinkingDiv);
            finalContent = text.replace(thoughtRegex, '').trim();
        }

        // 2. Render Markdown
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('ai-content');
        contentDiv.innerHTML = marked.parse(finalContent);
        element.appendChild(contentDiv);

        // 3. Highlight Code
        element.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        // 4. Render LaTeX
        if (window.renderMathInElement) {
            renderMathInElement(element, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    };

    const handleSendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // Hide templates on first message
        if (templateMatrix) templateMatrix.classList.add('hidden');

        appendMessage(text, 'user');
        chatInput.value = '';

        // Show typing indicator
        appendMessage('...', 'ai');
        const lastMsg = chatMessages.lastElementChild;

        try {
            const response = await fetch(AI_CONFIG.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: AI_CONFIG.model,
                    messages: [{ role: 'user', content: text }],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            lastMsg.textContent = '';
            processAIResponse(aiResponse, lastMsg);
        } catch (error) {
            console.error('Chat Error:', error);
            lastMsg.textContent = 'Lo siento, hubo un error al conectar con el asistente de IA. Por favor, verifica la configuración de la API.';
        }
    };

    // Template handlers
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.getAttribute('data-prompt');
            handleSendMessage();
        });
    });

    sendChat.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
});
