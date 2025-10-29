// Références aux éléments HTML
const setupContainer = document.getElementById('game-setup');
const categorySelect = document.getElementById('category-select');
const startGameBtn = document.getElementById('start-game-btn');
const userTypeResultEl = document.getElementById('user-type-result');

// NOUVELLES RÉFÉRENCES
const liveScoreContainer = document.getElementById('live-score-container');
const liveSmashCount = document.getElementById('live-smash-count');
const backToMenuBtn = document.getElementById('back-to-menu-btn');

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
const VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const URL_CHAMPIONS_TPL = 'https://ddragon.leagueoflegends.com/cdn/{version}/data/fr_FR/champion.json';
const URL_SPLASH_TPL = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/';

// Variables du jeu
let allChampionsData = {};
let championKeys = [];
let filteredChampionKeys = [];
let smashList = [];
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
 * Charge les données et prépare l'écran de sélection.
 */
async function loadGame() {
    try {
        const versionResponse = await fetch(VERSION_URL);
        const versions = await versionResponse.json();
        const latestVersion = versions[0];
        
        const championsURL = URL_CHAMPIONS_TPL.replace('{version}', latestVersion);
        splashURL = URL_SPLASH_TPL;

        const response = await fetch(championsURL);
        const data = await response.json();
        
        allChampionsData = data.data;
        championKeys = Object.keys(allChampionsData);
        
        populateTagFilter();
        
    } catch (error) {
        console.error("Erreur de chargement des champions:", error);
        setupContainer.innerHTML = "<h2>Erreur de chargement</h2><p>Impossible de récupérer les données des champions. Veuillez rafraîchir la page.</p>";
    }
}

/**
 * Remplir le filtre des catégories
 */
function populateTagFilter() {
    const tags = new Set();
    for (const key of championKeys) {
        allChampionsData[key].tags.forEach(tag => tags.add(tag));
    }

    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.innerText = tag;
        categorySelect.appendChild(option);
    });
}

/**
 * Démarrer la partie
 */
function startGame() {
    const selectedCategory = categorySelect.value;
    
    if (selectedCategory === 'all') {
        filteredChampionKeys = [...championKeys];
    } else {
        filteredChampionKeys = championKeys.filter(key => 
            allChampionsData[key].tags.includes(selectedCategory)
        );
    }
    
    shuffleArray(filteredChampionKeys);
    
    // Réinitialiser les scores
    currentIndex = 0;
    smashCount = 0;
    smashList = [];
    totalCountEl.innerText = filteredChampionKeys.length;
    liveSmashCount.innerText = '0'; // MODIFIÉ: Réinitialise le score en direct

    // Changer l'affichage de l'interface
    setupContainer.classList.add('hidden');
    cardContainer.classList.remove('hidden');
    buttonsContainer.classList.remove('hidden');
    liveScoreContainer.classList.remove('hidden'); // MODIFIÉ: Affiche le score
    resultsContainer.classList.add('hidden');
    
    displayChampion();
}

/**
 * Afficher le champion actuel (MODIFIÉ AVEC SKINS ALÉATOIRES)
 */
function displayChampion() {
    if (currentIndex >= filteredChampionKeys.length) {
        showResults();
        return;
    }
    
    champImage.style.opacity = '0';
    loader.style.display = 'block';

    const key = filteredChampionKeys[currentIndex];
    const champion = allChampionsData[key];
    
    // --- NOUVELLE LOGIQUE POUR LES SKINS ALÉATOIRES ---
    // 1. Obtenir le tableau des skins du champion
    const skins = champion.skins;
    
    // 2. Choisir un index aléatoire dans ce tableau
    const randomIndex = Math.floor(Math.random() * skins.length);
    
    // 3. Obtenir le numéro de ce skin (ex: 0, 1, 2, ...)
    const skinNum = skins[randomIndex].num;
    // --- FIN DE LA NOUVELLE LOGIQUE ---

    const img = new Image();
    // MODIFIÉ : Utiliser le 'skinNum' aléatoire au lieu de '_0'
    img.src = `${splashURL}${key}_${skinNum}.jpg`; 
    
    img.onload = () => {
        champName.innerText = champion.name;
        champTitle.innerText = champion.title;
        champImage.src = img.src;
        loader.style.display = 'none';
        champImage.style.opacity = '1';
    };

    // MODIFIÉ : Gestion d'erreur améliorée
    img.onerror = () => {
        console.error(`Erreur de chargement pour l'image : ${key}_${skinNum}.jpg`);
        
        // Plan de secours : Si le skin aléatoire ne se charge pas (rare, mais possible),
        // on essaie de charger le skin par défaut (_0.jpg) avant d'abandonner.
        if (img.src !== `${splashURL}${key}_0.jpg`) {
            console.warn(`Tentative de repli sur le skin par défaut pour ${key}`);
            img.src = `${splashURL}${key}_0.jpg`;
        } else {
            // Si même le skin par défaut échoue, on passe au suivant.
            console.error(`Le skin par défaut pour ${key} a aussi échoué. On passe.`);
            makeChoice('error'); // 'error' ne compte pas comme un smash
        }
    };
}

/**
 * Gérer le choix
 */
function makeChoice(choice) {
    if (choice === 'smash') {
        smashCount++;
        liveSmashCount.innerText = smashCount; // MODIFIÉ: Met à jour le score en direct
        
        const key = filteredChampionKeys[currentIndex];
        smashList.push(allChampionsData[key]);
    }
    
    currentIndex++;
    displayChampion();
}

/**
 * Afficher l'écran de fin
 */
function showResults() {
    cardContainer.classList.add('hidden');
    buttonsContainer.classList.add('hidden');
    liveScoreContainer.classList.add('hidden'); // MODIFIÉ: Cache le score
    resultsContainer.classList.remove('hidden');
    
    smashCountEl.innerText = smashCount;
    
    analyzeSmashedTags();
}

/**
 * Analyser les tags des champions "smashés"
 */
function analyzeSmashedTags() {
    if (smashList.length === 0) {
        userTypeResultEl.innerText = "Vous n'avez smashé personne ! 😢";
        return;
    }

    const tagCounts = {};
    
    for (const champion of smashList) {
        for (const tag of champion.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
    }

    let maxCount = 0;
    let mainType = '';
    
    for (const tag in tagCounts) {
        if (tagCounts[tag] > maxCount) {
            maxCount = tagCounts[tag];
            mainType = tag;
        }
    }

    let message = `Votre type préféré : les **${mainType}s** ! (Avec ${maxCount} votes)`;
    userTypeResultEl.innerHTML = message;
}


/**
 * Relancer le jeu (retour au menu)
 */
function reloadGame() {
    setupContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    cardContainer.classList.add('hidden');
    buttonsContainer.classList.add('hidden');
    liveScoreContainer.classList.add('hidden'); // MODIFIÉ: Cache le score
}

// Lier les boutons aux fonctions
startGameBtn.addEventListener('click', startGame);
smashBtn.addEventListener('click', () => makeChoice('smash'));
passBtn.addEventListener('click', () => makeChoice('pass'));
reloadBtn.addEventListener('click', reloadGame);
backToMenuBtn.addEventListener('click', reloadGame); // NOUVEAU

// Démarrer le processus de chargement
loadGame();

