// ============================================
// input.js — Captura teclado, mouse e toque
// ============================================

const input = {

    teclas: {},
    teclasFrame: {},
    mouse: { x: 0, y: 0, down: false },
    _mouseFrame: false,

    init(canvas) {

        window.addEventListener('keydown', (e) => {
            const tecla = e.key.toLowerCase();
            if (!this.teclas[tecla]) {
                this.teclasFrame[tecla] = true;
            }
            this.teclas[tecla] = true;
            if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.teclas[e.key.toLowerCase()] = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
        });

        canvas.addEventListener('mousedown', () => {
            this.mouse.down = true;
            this._mouseFrame = true;
        });

        canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });

        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
            this.mouse.down = true;
            this._mouseFrame = true;
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
            this.mouse.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
        });

        canvas.addEventListener('touchend', () => {
            this.mouse.down = false;
        });
    },

    limparFrame() {
        this.teclasFrame = {};
        this._mouseFrame = false;
    },

    pressionada(tecla) {
        return this.teclas[tecla] === true;
    },

    acabouDePressionar(tecla) {
        return this.teclasFrame[tecla] === true;
    },

    clicou() {
        return this._mouseFrame;
    },

    movimento() {
        let dx = 0;
        let dy = 0;
        if (this.pressionada('w') || this.pressionada('arrowup'))    dy -= 1;
        if (this.pressionada('s') || this.pressionada('arrowdown'))  dy += 1;
        if (this.pressionada('a') || this.pressionada('arrowleft'))  dx -= 1;
        if (this.pressionada('d') || this.pressionada('arrowright')) dx += 1;
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
        return { x: dx, y: dy };
    }
};