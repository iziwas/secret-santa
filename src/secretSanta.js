const MAX_ATTEMPTS = 1000;

function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Tire au sort une attribution où personne ne s'offre de cadeau à soi-même
 * et où les exclusions sont respectées.
 *
 * @param {string[]} participants
 * @param {Record<string, string[]>} exclusions donneur -> receveurs interdits
 * @returns {{giver: string, receiver: string}[] | null} null si aucun tirage
 *   valide n'a été trouvé en MAX_ATTEMPTS essais
 */
export function generateAssignments(participants, exclusions = {}) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const receivers = shuffle(participants);
        const valid = participants.every((giver, i) =>
            giver !== receivers[i] && !exclusions[giver]?.includes(receivers[i])
        );

        if (valid) {
            return participants.map((giver, i) => ({ giver, receiver: receivers[i] }));
        }
    }

    return null;
}
