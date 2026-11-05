const MAX_ATTEMPTS = 1000;

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function canGive(giver, receiver, exclusions) {
    return giver !== receiver && !exclusions.get(giver)?.includes(receiver);
}

/**
 * Cherche une attribution valide par couplage biparti (algorithme de Kuhn) :
 * si un receveur est déjà pris, son donneur tente de se rabattre sur un autre.
 * Tout tirage valide peut sortir, mais pas tous avec la même probabilité.
 */
function findMatching(participants, exclusions) {
    const giverOf = new Map();

    const assign = (giver, visited) => {
        for (const receiver of shuffle(participants)) {
            if (visited.has(receiver) || !canGive(giver, receiver, exclusions)) continue;
            visited.add(receiver);

            if (!giverOf.has(receiver) || assign(giverOf.get(receiver), visited)) {
                giverOf.set(receiver, giver);
                return true;
            }
        }
        return false;
    };

    if (!shuffle(participants).every(giver => assign(giver, new Set()))) {
        return null;
    }

    const receiverOf = new Map([...giverOf].map(([receiver, giver]) => [giver, receiver]));
    return participants.map(giver => ({ giver, receiver: receiverOf.get(giver) }));
}

/**
 * Tire au sort une attribution où personne ne s'offre de cadeau à soi-même
 * et où les exclusions sont respectées.
 *
 * Les essais aléatoires donnent la même chance à chaque tirage valide. Ils
 * échouent presque toujours quand ces tirages sont très rares : le couplage
 * prend alors le relais, ce qui permet de conclure à coup sûr.
 *
 * @param {string[]} participants
 * @param {Map<string, string[]>} exclusions donneur -> receveurs interdits.
 *   Une Map, car les noms sont saisis librement : dans un objet, "constructor"
 *   ou "__proto__" désigneraient des propriétés héritées.
 * @returns {{giver: string, receiver: string}[] | null} null uniquement si
 *   aucun tirage valide n'existe
 */
export function generateAssignments(participants, exclusions = new Map()) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const receivers = shuffle(participants);
        const valid = participants.every((giver, i) => canGive(giver, receivers[i], exclusions));

        if (valid) {
            return participants.map((giver, i) => ({ giver, receiver: receivers[i] }));
        }
    }

    return findMatching(participants, exclusions);
}
