// Main entry point for the Web Demo
let audioContext = null;
let workletNode = null;

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');

function log(msg) {
    statusDiv.style.display = 'block';
    statusDiv.innerHTML += `<div class="log">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
    console.log(msg);
}

async function startEngine() {
    try {
        log("Initializing AudioContext...");
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        log("Loading prosody-worklet.js...");
        await audioContext.audioWorklet.addModule('prosody-worklet.js');
        
        log("Creating AudioWorkletNode...");
        workletNode = new AudioWorkletNode(audioContext, 'prosody-processor');
        
        workletNode.port.onmessage = (event) => {
            if (event.data.type === 'status') {
                log(`Worklet Status: ${event.data.message}`);
            }
        };

        // Connect to destination (speakers)
        // For a real demo, we'd hook up a microphone source
        const oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        
        oscillator.connect(gain);
        gain.connect(workletNode);
        workletNode.connect(audioContext.destination);
        
        oscillator.start();
        log("Audio Graph running. Playing 440Hz tone through processor.");

        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // Keep references to stop later
        window.currentOscillator = oscillator;
        
    } catch (err) {
        log(`Error: ${err.message}`);
        console.error(err);
    }
}

function stopEngine() {
    if (audioContext) {
        if (window.currentOscillator) {
            window.currentOscillator.stop();
            window.currentOscillator = null;
        }
        audioContext.close();
        audioContext = null;
        workletNode = null;
        log("Engine stopped.");
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
}

startBtn.addEventListener('click', () => { 
    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    } else {
        startEngine(); 
    }
});

stopBtn.addEventListener('click', stopEngine);
