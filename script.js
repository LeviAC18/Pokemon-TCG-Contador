let playersData = {
    1: [],
    2: []
};
let currentPlayer = 1;

function switchPlayer(playerNum) {
    currentPlayer = playerNum;
    document.querySelectorAll('.tab-btn').forEach((btn, index) => {
        btn.classList.toggle('active', index === (playerNum - 1));
    });
    document.getElementById('player1-list').classList.toggle('hidden', playerNum !== 1);
    document.getElementById('player2-list').classList.toggle('hidden', playerNum !== 2);
}

// Tratamento especial para nomes que a PokéAPI registra de forma diferente
function sanitizePokemonName(name) {
    let cleanName = name.toLowerCase().trim().replace(/\s+/g, "-");

    // Dicionário de correções automáticas para o padrão da API
    const specialCases = {
        "mimikyu": "mimikyu-disguised",
        "morpeko": "morpeko-full-belly",
        "eiscue": "eiscue-ice",
        "wishiwashi": "wishiwashi-solo",
        "aegislash": "aegislash-shield",
        "giratina": "giratina-altered",
        "shaymin": "shaymin-land",
        "deoxys": "deoxys-normal",
        "keldeo": "keldeo-ordinary",
        "meloetta": "meloetta-aria",
        "basculin": "basculin-red-striped",
        "darmanitan": "darmanitan-standard",
        "tornadus": "tornadus-incarnate",
        "thundurus": "thundurus-incarnate",
        "landorus": "landorus-incarnate",
        "enamorus": "enamorus-incarnate",
        "pumpkaboo": "pumpkaboo-average",
        "gourgeist": "gourgeist-average",
        "zygarde": "zygarde-50",
        "lycanroc": "lycanroc-midday",
        "urshifu": "urshifu-single-strike",
        "toxtricity": "toxtricity-amped"
    };

    if (specialCases[cleanName]) {
        return specialCases[cleanName];
    }

    return cleanName;
}

// Função para buscar imagens dinamicamente na PokeAPI
async function fetchPokemonImages(name) {
    const apiName = sanitizePokemonName(name);
    // Imagem padrão (Pokébola) caso dê erro na busca
    const defaultImg = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${apiName}`);
        if (!response.ok) return [defaultImg];
        
        const data = await response.json();
        
        // Coleta as artes disponíveis
        const images = [
            data.sprites.other['official-artwork'].front_default,
            data.sprites.other['home'].front_default,
            data.sprites.front_default,
            data.sprites.other['official-artwork'].front_shiny
        ].filter(url => url !== null && url !== undefined); // Remove opções nulas

        return images.length > 0 ? images : [defaultImg];
    } catch (error) {
        return [defaultImg];
    }
}

async function addPokemon() {
    const nameInput = document.getElementById('pokeName');
    const hpInput = document.getElementById('pokeHp');
    const typeSelect = document.getElementById('pokeType');

    if (!nameInput.value.trim()) return alert("Insira o nome do Pokémon!");

    const name = nameInput.value;
    // Busca a imagem tratando o nome digitado
    const imageList = await fetchPokemonImages(name);

    const pokemon = {
        id: Date.now().toString(),
        name: name,
        maxHp: parseInt(hpInput.value),
        currentHp: parseInt(hpInput.value),
        type: typeSelect.value,
        isActive: false,
        images: imageList,
        currentImageIndex: 0
    };

    playersData[currentPlayer].push(pokemon);
    nameInput.value = '';
    render();
}

// Alternar entre as imagens salvas na lista do Pokémon
function cycleImage(id, event) {
    event.stopPropagation(); 
    const pokemon = playersData[currentPlayer].find(p => p.id === id);
    if (!pokemon || pokemon.images.length <= 1) return;

    pokemon.currentImageIndex = (pokemon.currentImageIndex + 1) % pokemon.images.length;
    render();
}

function changeHp(id, isDamage) {
    const cardElement = document.getElementById(id);
    const inputAmount = cardElement.querySelector('.damage-input');
    const amount = parseInt(inputAmount.value) || 0;

    const pokemon = playersData[currentPlayer].find(p => p.id === id);
    if (!pokemon) return;

    if (isDamage) {
        pokemon.currentHp = Math.max(0, pokemon.currentHp - amount);
        // Dispara animação visual de tremor mecânico
        cardElement.classList.add('shake-animation');
        cardElement.addEventListener('animationend', () => {
            cardElement.classList.remove('shake-animation');
        }, { once: true });
    } else {
        pokemon.currentHp = Math.min(pokemon.maxHp, pokemon.currentHp + amount);
    }

    render();
}

function setAtive(id) {
    playersData[currentPlayer].forEach(p => {
        if (p.id === id) {
            p.isActive = !p.isActive;
        } else {
            p.isActive = false;
        }
    });
    render();
}

function deletePokemon(id) {
    playersData[currentPlayer] = playersData[currentPlayer].filter(p => p.id !== id);
    render();
}

function render() {
    const listContainer = document.getElementById(`player${currentPlayer}-list`);
    listContainer.innerHTML = '';

    playersData[currentPlayer].forEach(pokemon => {
        const isDefeated = pokemon.currentHp === 0;
        const card = document.createElement('div');
        
        card.className = `pokemon-card ${pokemon.isActive ? 'active-pokemon' : ''} ${isDefeated ? 'defeated' : ''}`;
        card.id = pokemon.id;
        card.draggable = !isDefeated; 

        const currentImgUrl = pokemon.images[pokemon.currentImageIndex];

        card.innerHTML = `
            <div class="card-frame" style="background: var(--bgi-${pokemon.type})">
                <div class="card-header">
                    <span class="poke-name">${pokemon.name}</span>
                    <span class="poke-type">${pokemon.type}</span>
                </div>
                <div class="poke-image-container">
                    <img class="poke-image" src="${currentImgUrl}" alt="${pokemon.name}">
                    ${pokemon.images.length > 1 ? `<button class="cycle-img-btn" onclick="cycleImage('${pokemon.id}', event)">🔄 Mudar Arte</button>` : ''}
                </div>
            </div>
            <div class="life-section">
                <div class="life-display">${pokemon.currentHp} <span style="font-size:1rem; color:#9ca3af;">/ ${pokemon.maxHp} HP</span></div>
            </div>
            <div class="damage-controls">
                <input type="number" class="damage-input" value="10" step="10" min="0">
                <button class="btn-damage" onclick="changeHp('${pokemon.id}', true)">Dano</button>
                <button class="btn-heal" onclick="changeHp('${pokemon.id}', false)">+</button>
            </div>
            <div class="card-actions">
                <button class="active-btn" onclick="setAtive('${pokemon.id}')">
                    ${pokemon.isActive ? '★ Ativo' : 'Definir Ativo'}
                </button>
                <button class="delete-btn" onclick="deletePokemon('${pokemon.id}')">🗑️</button>
            </div>
        `;

        if (!isDefeated) {
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        }

        listContainer.appendChild(card);
    });

    addDragAndDropEvents(listContainer);
}

function addDragAndDropEvents(container) {
    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const dragging = document.querySelector('.dragging');
        if (dragging == null) return;
        
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });

    container.addEventListener('drop', () => {
        const currentIds = Array.from(container.querySelectorAll('.pokemon-card')).map(c => c.id);
        const reorderedList = currentIds.map(id => playersData[currentPlayer].find(p => p.id === id));
        playersData[currentPlayer] = reorderedList;
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.pokemon-card:not(.dragging):not(.defeated)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}