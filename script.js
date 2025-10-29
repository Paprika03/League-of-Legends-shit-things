// Références aux éléments HTML (AJOUTÉ)
const setupContainer = document.getElementById('game-setup');
const categorySelect = document.getElementById('category-select');
const startGameBtn = document.getElementById('start-game-btn');
const userTypeResultEl = document.getElementById('user-type-result');

// ... (gardez vos références existantes : loader, champImage, etc.) ...
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

// Constantes de l'API (inchangées)
const VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const URL_CHAMPIONS_TPL = 'https://ddragon.leagueoflegends.com/cdn/{version}/data/fr_FR/champion.json';
const URL_SPLASH_TPL = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/';

// Variables du jeu (AJOUTÉ/MODIFIÉ)
let allChampionsData = {};
let championKeys = [];
let filteredChampionKeys = []; // NOUVEAU: La liste qu'on va jouer
let smashList = []; // NOUVEAU: Stocke les champions "smashés"
let currentIndex = 0;
let smashCount = 0;
let splashURL = '';

// ... (gardez votre fonction shuffleArray inchangée) ...
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Étape 1 : Charger les données des champions (MODIFIÉ)
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
        
        // NOUVEAU: Remplir le filtre des catégories
        populateTagFilter();

        // Le jeu ne commence plus automatiquement
        // displayChampion(); // Supprimez cette ligne
        
    } catch (error) {
        console.error("Erreur de chargement des champions:", error);
        setupContainer.innerHTML = "<h2>Erreur de chargement</h2><p>Impossible de récupérer les données des champions. Veuillez rafraîchir la page.</p>";
    }
}

/**
 * NOUVELLE FONCTION : Remplir le filtre des catégories
 */
function populateTagFilter() {
    const tags = new Set(); // Un 'Set' évite les doublons
    for (const key of championKeys) {
        allChampionsData[key].tags.forEach(tag => tags.add(tag));
    }

    // Ajoute chaque tag comme une <option> dans le <select>
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.innerText = tag;
        categorySelect.appendChild(option);
    });
}

/**
 * NOUVELLE FONCTION : Démarrer la partie
 */
function startGame() {
    // 1. Récupérer la catégorie choisie
    const selectedCategory = categorySelect.value;
    
    // 2. Filtrer la liste des champions
    if (selectedCategory === 'all') {
        filteredChampionKeys = [...championKeys]; // Copie tout le tableau
    } else {
        filteredChampionKeys = championKeys.filter(key => 
            allChampionsData[key].tags.includes(selectedCategory)
        );
    }
    
    // 3. Mélanger la liste filtrée
    shuffleArray(filteredChampionKeys);
    
    // 4. Réinitialiser les scores
    currentIndex = 0;
    smashCount = 0;
    smashList = []; // Vider la liste des smash
    totalCountEl.innerText = filteredChampionKeys.length; // Mettre à jour le total
    
    // 5. Changer l'affichage de l'interface
    setupContainer.classList.add('hidden');
    cardContainer.classList.remove('hidden');
    buttonsContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden'); // Cacher les résultats précédents
    
    // 6. Afficher le premier champion
    displayChampion();
}

/**
 * Étape 2 : Afficher le champion actuel (MODIFIÉ)
 * Utilise la liste 'filteredChampionKeys'
 */
function displayChampion() {
    // Vérifie si on a fini la liste filtrée
    if (currentIndex >= filteredChampionKeys.length) {
        showResults();
        return;
    }
    
    champImage.style.opacity = '0';
    loader.style.display = 'block';

    const key = filteredChampionKeys[currentIndex]; // MODIFIÉ
    const champion = allChampionsData[key];
    
    const img = new Image();
    img.src = `${splashURL}${key}_0.jpg`;
    
    img.onload = () => {
        champName.innerText = champion.name;
        champTitle.innerText = champion.title;
        champImage.src = img.src;
        loader.style.display = 'none';
        champImage.style.opacity = '1';
    };

    img.onerror = () => {
        console.error(`Erreur de chargement pour l'image : ${key}`);
        makeChoice('error'); 
    };
}

/**
 * Étape 3 : Gérer le choix (MODIFIÉ)
 * Ajoute le champion à 'smashList'
 */
function makeChoice(choice) {
    if (choice === 'smash') {
        smashCount++;
        // NOUVEAU: Ajoute le champion (ou juste ses tags) à la liste
        const key = filteredChampionKeys[currentIndex];
        smashList.push(allChampionsData[key]);
    }
    
    currentIndex++;
    displayChampion();
}

/**
 * Étape 4 : Afficher l'écran de fin (MODIFIÉ)
 * Appelle l'analyseur de type
 */
function showResults() {
    cardContainer.classList.add('hidden');
    buttonsContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
    
    smashCountEl.innerText = smashCount;
    
    // NOUVEAU: Analyser et afficher le type
    analyzeSmashedTags();
}

/**
 * NOUVELLE FONCTION : Analyser les tags des champions "smashés"
 */
function analyzeSmashedTags() {
    if (smashList.length === 0) {
        userTypeResultEl.innerText = "Vous n'avez smashé personne ! 😢";
        return;
    }

    const tagCounts = {};
    
    // 1. Compter chaque tag
    for (const champion of smashList) {
        for (const tag of champion.tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
    }

    // 2. Trouver le tag avec le score le plus élevé
    let maxCount = 0;
    let mainType = '';
    
    for (const tag in tagCounts) {
        if (tagCounts[tag] > maxCount) {
            maxCount = tagCounts[tag];
            mainType = tag;
        }
    }

    // 3. Afficher un message personnalisé
    let message = `Votre type préféré : les **${mainType}s** ! (Avec ${maxCount} votes)`;
    userTypeResultEl.innerHTML = message; // .innerHTML pour que le <strong> fonctionne
}


/**
 * Étape 5 : Relancer le jeu (MODIFIÉ)
 * Retourne à l'écran de sélection
 */
function reloadGame() {
    // Ré-afficher l'écran de sélection
    setupContainer.classList.remove('hidden');
    resultsContainer.classList.add('hidden');
    
    // Cacher le jeu (au cas où)
    cardContainer.classList.add('hidden');
    buttonsContainer.classList.add('hidden');
}

// Lier les boutons aux fonctions (AJOUTÉ)
startGameBtn.addEventListener('click', startGame); // NOUVEAU
smashBtn.addEventListener('click', () => makeChoice('smash'));
passBtn.addEventListener('click', () => makeChoice('pass'));
reloadBtn.addEventListener('click', reloadGame);

// Démarrer le processus de chargement
loadGame();
