export class UI {
    constructor(animation) {
        this.animation = animation;
        console.log('🖥️ UI system initialized');
    }

    showMessage(message, duration = 3000) {
        const textElement = document.getElementById('narrative-text');
        textElement.textContent = message;
        textElement.classList.add('show');

        setTimeout(() => {
            textElement.classList.remove('show');
        }, duration);
    }

    setProgress(percent) {
        document.getElementById('progress-bar').style.width = percent + '%';
    }
}
