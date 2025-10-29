// Références aux éléments HTML
const loader = document.getElementById('loader');
const champImage = document.getElementById('champion-image');
const champName = document.getElementById('champion-name');
const champTitle = document.getElementById('champion-title');
const passBtn = document.getElementById('pass-btn');
const smashBtn = document.getElementById('smash-btn');
const cardContainer = document.getElementById('champion-card');
const buttonsContainer = document.getElementById('buttons');
const resultsContainer = document.getElementById('results');
const smashCountEl = document.getElementById('smash-count');
const totalCountEl = document.getElementById('total-count');
const reloadBtn = document.getElementById('reload-btn');

// Constantes de l'API
// On récupère la dernière version dynamiquement
const VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const URL_CHAMPIONS_TPL = 'https://ddragon.leagueoflegends.com/cdn/{version}/data/fr_FR/champion.json';
const URL_SPLASH_TPL = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/';

// Variables du jeu
let allChampionsData = {};
let championKeys = [];
let currentIndex = 0;
let smashCount = 0;
let splashURL = '';

/**
 * Mélange un tableau (algorithme Fisher-Yates)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Étape 1 : Charger les données des champions
 */
async function loadGame() {
    try {
        // 1. Obtenir la dernière version du jeu
        const versionResponse = await fetch(VERSION_URL);
        const versions = await versionResponse.json();
        const latestVersion = versions[0]; // La première est la plus récente
        
        // 2. Construire les URL finaux
        const championsURL = URL_CHAMPIONS_TPL.replace('{version}', latestVersion);
        splashURL = URL_SPLASH_TPL; // Le CDN de splash n'a pas besoin de la version

        // 3. Obtenir les données des champions
        const response = await fetch(championsURL);
        const data = await response.json();
        
        allChampionsData = data.data;
        championKeys = Object.keys(allChampionsData);
        
        // 4. Mélanger et démarrer
        shuffleArray(championKeys);
        totalCountEl.innerText = championKeys.length; // Met à jour le total sur l'écran de fin
        
        // 5. Démarrer le jeu
        displayChampion();
        
    } catch (error) {
        console.error("Erreur de chargement des champions:", error);
        loader.innerText = "Erreur de chargement";
        champName.innerText = "Veuillez rafraîchir la page.";
    }
}

/**
 * Étape 2 : Afficher le champion actuel
 */
function displayChampion() {
    // Vérifie si on a fini la liste
    if (currentIndex >= championKeys.length) {
        showResults();
        return;
    }
    
    // Masquer l'image et afficher le loader pendant le chargement
    champImage.style.opacity = '0';
    loader.style.display = 'block';

    const key = championKeys[currentIndex];
    const champion = allChampionsData[key];
    
    // Pré-charger l'image
    const img = new Image();
    img.src = `${splashURL}${key}_0.jpg`;
    
    // Quand l'image est prête
    img.onload = () => {
        // Met à jour l'interface
        champName.innerText = champion.name;
        champTitle.innerText = champion.title;
        champImage.src = img.src;
        
        // Masquer le loader et afficher l'image
        loader.style.display = 'none';
        champImage.style.opacity = '1';
    };

    img.onerror = () => {
        // Gérer le cas où une image ne charge pas
        console.error(`Erreur de chargement pour l'image : ${key}`);
        // Passer au suivant
        makeChoice('error'); 
    };
}

/**
 * Étape 3 : Gérer le choix (Smash ou Pass)
 */
function makeChoice(choice) {
    if (choice === 'smash') {
        smashCount++;
    }
    
    // Passer au champion suivant
    currentIndex++;
    displayChampion();
}

/**
 * Étape 4 : Afficher l'écran de fin
 */
function showResults() {
    cardContainer.classList.add('hidden');
    buttonsContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    smashCountEl.innerText = smashCount;
}

/**
 * Étape 5 : Relancer le jeu
 */
function reloadGame() {
    currentIndex = 0;
    smashCount = 0;
    shuffleArray(championKeys);
    
    cardContainer.classList.remove('hidden');
    buttonsContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    displayChampion();
}

// Lier les boutons aux fonctions
smashBtn.addEventListener('click', () => makeChoice('smash'));
passBtn.addEventListener('click', () => makeChoice('pass'));
reloadBtn.addEventListener('click', reloadGame);

// Démarrer le jeu au chargement de la page
loadGame();