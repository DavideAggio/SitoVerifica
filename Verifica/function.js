// Timer
function avviaTimer() {
    let tempo = localStorage.getItem("tempo_rimanente") 
        ? parseInt(localStorage.getItem("tempo_rimanente")) 
        : 3600;

    const timerElement = document.getElementById('timer');
    const interval = setInterval(() => {
        if (tempo <= 0) {
            clearInterval(interval);
            alert("Tempo scaduto!");
            return;
        }
        tempo--;
        localStorage.setItem("tempo_rimanente", tempo);
        const minuti = Math.floor(tempo / 60);
        const secondi = tempo % 60;
        timerElement.textContent = `${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
    }, 1000);
}

// Salvataggio risposte
function salvaRispostaCorrente() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const risposta = document.getElementById('risposta');
    if (risposta) {
        localStorage.setItem(`domanda_aperta_${id}`, risposta.value);
    }
}

// Vai a una pagina
function vaiAPagina(url) {
    salvaRispostaCorrente();
    window.location.href = url;
}

// Carica una domanda aperta
function caricaDomandaAperta() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    fetch('domande.json')
        .then(response => response.json())
        .then(data => {
            const domanda = data.domandeAperte.find(d => d.id == id);
            if (domanda) {
                document.getElementById('titolo-domanda').textContent = domanda.testo;
                document.getElementById('risposta').value = localStorage.getItem(`domanda_aperta_${id}`) || '';
                aggiornaContatore();
            }
        });
}

// Carica domande a crocette
function caricaDomandeCrocette() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    fetch('domande.json')
        .then(response => response.json())
        .then(data => {
            const testo = data.testiCrocette.find(t => t.id === id);
            if (testo) {
                document.getElementById('titolo-testo').textContent = `Testo ${id.toUpperCase()}`;
                document.getElementById('testo').textContent = testo.testo;

                const domandeContainer = document.getElementById('domande-crocette');
                domandeContainer.innerHTML = testo.domande.map(domanda => `
                    <div>
                        <p>${domanda.id}. ${domanda.testo}</p>
                        ${domanda.opzioni.map(opzione => `
                            <label>
                                <input type="radio" name="domanda_${domanda.id}" value="${opzione}" 
                                    onchange="salvaRispostaCrocetta('${id}', ${domanda.id}, '${opzione}')">
                                ${opzione}
                            </label>
                        `).join('')}
                    </div>
                `).join('');
            }
        });
}

// Salva risposta a crocetta
function salvaRispostaCrocetta(testoId, domandaId, risposta) {
    localStorage.setItem(`crocetta_${testoId}_${domandaId}`, risposta);
}

// Aggiorna contatore caratteri
function aggiornaContatore() {
    const textarea = document.getElementById('risposta');
    const contatore = document.getElementById('conta-caratteri');
    textarea.addEventListener('input', () => {
        contatore.textContent = textarea.value.length;
    });
}

// Al caricamento delle pagine
document.addEventListener('DOMContentLoaded', () => {
    avviaTimer();
    if (window.location.pathname.includes('domanda_aperta.html')) {
        caricaDomandaAperta();
    } else if (window.location.pathname.includes('crocetta.html')) {
        caricaDomandeCrocette();
    }
});
function consegna() {
    // Mostra il messaggio di consegna
    document.getElementById('consegna-msg').style.display = 'block';

    // Disabilita i pulsanti per evitare che l'utente rientri nelle domande
    document.querySelectorAll('button').forEach(button => {
        button.disabled = true;
    });

    // Salva lo stato di consegna
    localStorage.setItem("consegnato", "true");

    // Salva le risposte nel file .txt
    salvaRisposteNelFile();
}
function salvaRisposteNelFile() {
    let contenuto = "Verifica Consegnata\n\n";

    // Carica il file JSON per ottenere le domande
    fetch('domande.json')
        .then(response => response.json())
        .then(data => {
            // Aggiungi risposte delle domande aperte
            data.domandeAperte.forEach(domanda => {
                const risposta = localStorage.getItem(`domanda_aperta_${domanda.id}`);
                contenuto += `Domanda Aperta ${domanda.id}: ${domanda.testo}\nRisposta: ${risposta || "Nessuna risposta"}\n\n`;
            });

            // Aggiungi risposte delle domande a crocette
            data.testiCrocette.forEach(testo => {
                contenuto += `Testo ${testo.id}: ${testo.testo}\n`;
                testo.domande.forEach(domanda => {
                    const risposta = localStorage.getItem(`crocetta_${testo.id}_${domanda.id}`);
                    contenuto += `Domanda ${domanda.id}: ${domanda.testo}\nRisposta: ${risposta || "Nessuna risposta"}\n`;
                });
                contenuto += "\n";
            });

            // Crea il file di testo con le risposte
            const blob = new Blob([contenuto], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'verifica_consegnata.txt';
            link.click();
        });
}

// Esegui il controllo della consegna quando la pagina viene caricata
document.addEventListener('DOMContentLoaded', verificaConsegna);