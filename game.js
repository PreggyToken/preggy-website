document.addEventListener('DOMContentLoaded', function() {
    const game = {
        canvas: null,
        ctx: null,
        player: {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            speed: 4, // Reduced initial speed
            lives: 3
        },
        gameState: {
            level: 1,
            score: 0,
            highScore: localStorage.getItem('preggyHighScore') || 0,
            isPlaying: false,
            difficultyTimer: 0,
            spawnRate: 120, // Higher number = slower spawning
            objectSpeed: 2 // Initial speed of falling objects
        },
        objects: {
            tokens: [],
            obstacles: []
        },
        keys: {
            ArrowLeft: false,
            ArrowRight: false
        },
        sprites: {
            background: null,
            hearts: '❤️'
        },
        effects: {
            particles: []
        },

        init() {
            // Initialize canvas
            this.canvas = document.getElementById('gameCanvas');
            if (!this.canvas) return;
            
            this.ctx = this.canvas.getContext('2d');
            
            // Set initial player position
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.y = this.canvas.height - this.player.height - 10;
            
            // Event listeners
            window.addEventListener('keydown', (e) => this.handleKeyDown(e));
            window.addEventListener('keyup', (e) => this.handleKeyUp(e));
            
            // Mobile controls
            this.initMobileControls();
            
            // Start button
            const startBtn = document.getElementById('startGame');
            if (startBtn) {
                startBtn.addEventListener('click', () => this.startGame());
            }

            // Create gradient background
            this.createBackground();
            
            // Initial screen
            this.drawTitleScreen();
            this.updateScore();
        },

        createBackground() {
            const bgCanvas = document.createElement('canvas');
            bgCanvas.width = this.canvas.width;
            bgCanvas.height = this.canvas.height;
            const bgCtx = bgCanvas.getContext('2d');
            
            const gradient = bgCtx.createLinearGradient(0, 0, 0, bgCanvas.height);
            gradient.addColorStop(0, '#1a0033');
            gradient.addColorStop(1, '#000000');
            
            bgCtx.fillStyle = gradient;
            bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
            
            // Add some stars
            for (let i = 0; i < 50; i++) {
                bgCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
                bgCtx.beginPath();
                bgCtx.arc(
                    Math.random() * bgCanvas.width,
                    Math.random() * bgCanvas.height,
                    Math.random() * 1.5,
                    0,
                    Math.PI * 2
                );
                bgCtx.fill();
            }
            
            this.sprites.background = bgCanvas;
        },

        initMobileControls() {
            ['leftButton', 'rightButton'].forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) {
                    ['mousedown', 'touchstart'].forEach(event => {
                        btn.addEventListener(event, (e) => {
                            e.preventDefault();
                            this.keys[btnId === 'leftButton' ? 'ArrowLeft' : 'ArrowRight'] = true;
                        });
                    });
                    
                    ['mouseup', 'touchend'].forEach(event => {
                        btn.addEventListener(event, (e) => {
                            e.preventDefault();
                            this.keys[btnId === 'leftButton' ? 'ArrowLeft' : 'ArrowRight'] = false;
                        });
                    });
                }
            });
        },

        handleKeyDown(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                this.keys[e.key] = true;
            }
        },

        handleKeyUp(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                this.keys[e.key] = false;
            }
        },

        startGame() {
            this.gameState.isPlaying = true;
            this.gameState.score = 0;
            this.gameState.level = 1;
            this.gameState.difficultyTimer = 0;
            this.gameState.spawnRate = 120;
            this.gameState.objectSpeed = 2;
            this.player.lives = 3;
            this.objects.tokens = [];
            this.objects.obstacles = [];
            this.effects.particles = [];
            this.updateScore();
            this.gameLoop();
        },

        spawnObject() {
            if (Math.random() < 0.7) { // 70% chance for token
                this.objects.tokens.push({
                    x: Math.random() * (this.canvas.width - 30),
                    y: -30,
                    width: 30,
                    height: 30,
                    speed: this.gameState.objectSpeed
                });
            } else {
                const types = ['👮', '👶', '🤰'];
                this.objects.obstacles.push({
                    x: Math.random() * (this.canvas.width - 40),
                    y: -40,
                    width: 40,
                    height: 40,
                    speed: this.gameState.objectSpeed,
                    type: types[Math.floor(Math.random() * types.length)]
                });
            }
        },

        createParticle(x, y, color, isToken = false) {
            for (let i = 0; i < (isToken ? 10 : 5); i++) {
                this.effects.particles.push({
                    x,
                    y,
                    speed: Math.random() * 3 + 2,
                    angle: Math.random() * Math.PI * 2,
                    size: Math.random() * 3 + 2,
                    color,
                    life: 1
                });
            }
        },

        updateParticles() {
            for (let i = this.effects.particles.length - 1; i >= 0; i--) {
                const particle = this.effects.particles[i];
                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed;
                particle.life -= 0.02;
                particle.size *= 0.95;
                
                if (particle.life <= 0) {
                    this.effects.particles.splice(i, 1);
                }
            }
        },

        updateGame() {
            this.updatePlayer();
            this.updateObjects();
            this.updateParticles();
            
            // Increase difficulty over time
            this.gameState.difficultyTimer++;
            if (this.gameState.difficultyTimer >= 600) { // Every 10 seconds
                this.gameState.difficultyTimer = 0;
                this.gameState.level++;
                this.gameState.objectSpeed += 0.2;
                this.gameState.spawnRate = Math.max(60, this.gameState.spawnRate - 10);
            }
        },

        updatePlayer() {
            if (this.keys.ArrowLeft) {
                this.player.x = Math.max(0, this.player.x - this.player.speed);
            }
            if (this.keys.ArrowRight) {
                this.player.x = Math.min(this.canvas.width - this.player.width, 
                                       this.player.x + this.player.speed);
            }
        },

        updateObjects() {
            // Update tokens
            for (let i = this.objects.tokens.length - 1; i >= 0; i--) {
                const token = this.objects.tokens[i];
                token.y += token.speed;
                
                // Check collision
                if (this.checkCollision(token)) {
                    this.gameState.score += 10;
                    this.createParticle(token.x, token.y, '#ffd700', true);
                    this.objects.tokens.splice(i, 1);
                    this.updateScore();
                    continue;
                }
                
                if (token.y > this.canvas.height) {
                    this.objects.tokens.splice(i, 1);
                }
            }
            
            // Update obstacles
            for (let i = this.objects.obstacles.length - 1; i >= 0; i--) {
                const obstacle = this.objects.obstacles[i];
                obstacle.y += obstacle.speed;
                
                // Check collision
                if (this.checkCollision(obstacle)) {
                    this.player.lives--;
                    this.createParticle(obstacle.x, obstacle.y, '#ff4444');
                    this.objects.obstacles.splice(i, 1);
                    
                    if (this.player.lives <= 0) {
                        this.gameOver();
                    }
                    continue;
                }
                
                if (obstacle.y > this.canvas.height) {
                    this.objects.obstacles.splice(i, 1);
                }
            }
        },

        checkCollision(object) {
            return (this.player.x < object.x + object.width &&
                    this.player.x + this.player.width > object.x &&
                    this.player.y < object.y + object.height &&
                    this.player.y + this.player.height > object.y);
        },

        drawTitleScreen() {
            // Draw background
            this.ctx.drawImage(this.sprites.background, 0, 0);
            
            // Draw title
            this.ctx.fillStyle = '#ff69b4';
            this.ctx.textAlign = 'center';
            
            // Title with glow effect
            this.ctx.shadowColor = '#ff69b4';
            this.ctx.shadowBlur = 15;
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('🏃 Run From Responsibility!', 
                            this.canvas.width/2, this.canvas.height/2);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText('Press Start to Play', 
                            this.canvas.width/2, this.canvas.height/2 + 40);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        },

        draw() {
            // Draw background
            this.ctx.drawImage(this.sprites.background, 0, 0);
            
            // Draw game level
            this.ctx.fillStyle = '#ff69b4';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Level: ${this.gameState.level}`, 10, 25);
            
            // Draw lives
            for (let i = 0; i < this.player.lives; i++) {
                this.ctx.font = '20px Arial';
                this.ctx.fillText(this.sprites.hearts, 
                                this.canvas.width - 30 - (i * 25), 25);
            }
            
            // Draw player with shadow effect
            this.ctx.shadowColor = '#ff69b4';
            this.ctx.shadowBlur = 10;
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🏃', 
                            this.player.x + this.player.width/2, 
                            this.player.y + this.player.height);
            this.ctx.shadowBlur = 0;
            
            // Draw tokens
            this.objects.tokens.forEach(token => {
                this.ctx.font = '25px Arial';
                this.ctx.fillText('💰', token.x + token.width/2, token.y + token.height);
            });
            
            // Draw obstacles
            this.objects.obstacles.forEach(obstacle => {
                this.ctx.font = '30px Arial';
                this.ctx.fillText(obstacle.type, 
                                obstacle.x + obstacle.width/2, 
                                obstacle.y + obstacle.height);
            });
            
            // Draw particles
            this.effects.particles.forEach(particle => {
                this.ctx.fillStyle = `rgba(${particle.color}, ${particle.life})`;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        },

        updateScore() {
            const scoreElement = document.getElementById('score');
            const highScoreElement = document.getElementById('highscore');
            
            if (scoreElement) {
                scoreElement.textContent = `Score: ${this.gameState.score}`;
            }
            
            if (this.gameState.score > this.gameState.highScore) {
                this.gameState.highScore = this.gameState.score;
                localStorage.setItem('preggyHighScore', this.gameState.highScore);
            }
            
            if (highScoreElement) {
                highScoreElement.textContent = `Best: ${this.gameState.highScore}`;
            }
        },

        gameOver() {
            this.gameState.isPlaying = false;
            alert(`Game Over!\nScore: ${this.gameState.score}\nLevel: ${this.gameState.level}`);
            this.drawTitleScreen();
        },

        gameLoop() {
            if (!this.gameState.isPlaying) return;
            
            // Spawn new objects based on spawn rate
            if (this.gameState.difficultyTimer % this.gameState.spawnRate === 0) {
                this.spawnObject();
            }
            
            this.updateGame();
            this.draw();
            
            requestAnimationFrame(() => this.gameLoop());
        }
    };
    
    // Initialize the game
    game.init();
});
