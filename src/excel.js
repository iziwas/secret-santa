import * as XLSX from 'xlsx';

const MAX_NAME_LENGTH = 100;

const PARTICIPANTS_HEADER = ['Nom'];
const EXCLUSIONS_HEADER = ['Donneur', 'Ne peut pas offrir à'];

const INSTRUCTIONS = [
    ['Comment remplir ce fichier'],
    [],
    ['1. Onglet « Participants » : indiquez un nom par ligne, sous l\'en-tête « Nom ».'],
    ['2. Onglet « Exclusions » : indiquez une exclusion par ligne, ou laissez l\'onglet vide s\'il n\'y en a pas.'],
    ['3. Écrivez les noms des exclusions exactement comme dans l\'onglet « Participants » : un nom différent est sans effet.'],
    ['4. Une exclusion ne vaut que dans un sens : pour un couple, ajoutez une ligne pour chaque personne.'],
    ['5. Gardez les en-têtes et l\'ordre des onglets. Un nom ne doit pas dépasser 100 caractères.'],
    ['6. Importez ensuite ce fichier dans l\'application. Cet onglet peut rester tel quel : il n\'est pas lu.'],
    [],
    ['Exemple pour l\'onglet « Participants »'],
    PARTICIPANTS_HEADER,
    ['Alice'],
    ['Bob'],
    ['Claire'],
    [],
    ['Exemple pour l\'onglet « Exclusions »'],
    EXCLUSIONS_HEADER,
    ['Alice', 'Bob'],
    ['Bob', 'Alice'],
];

function appendSheet(workbook, name, rows, columnWidths) {
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    sheet['!cols'] = columnWidths.map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
}

/**
 * Construit le modèle à remplir. Les exemples restent dans le 3e onglet, que
 * parseWorkbook ne lit pas : un exemple oublié ne peut pas entrer dans le tirage.
 */
export function buildTemplateWorkbook() {
    const workbook = XLSX.utils.book_new();
    appendSheet(workbook, 'Participants', [PARTICIPANTS_HEADER], [30]);
    appendSheet(workbook, 'Exclusions', [EXCLUSIONS_HEADER], [30, 30]);
    appendSheet(workbook, 'Mode d\'emploi', INSTRUCTIONS, [30, 30]);
    return workbook;
}

/**
 * Extrait les participants et les exclusions d'un classeur. Les onglets sont
 * lus par position et la première ligne de chacun est considérée comme l'en-tête.
 *
 * @param {XLSX.WorkBook} workbook
 * @returns {{participants: string[], exclusions: Map<string, string[]>} | {error: string}}
 */
export function parseWorkbook(workbook) {
    if (!workbook.SheetNames || workbook.SheetNames.length < 2) {
        return { error: 'Le fichier doit contenir au moins 2 onglets.' };
    }

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const participantsData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
    const participants = [...new Set(
        participantsData
            .slice(1)
            .map(row => String(row[0] || '').trim())
            .filter(name => name && name.length <= MAX_NAME_LENGTH)
    )];

    if (participants.length === 0) {
        return { error: 'Aucun participant valide trouvé. Vérifie l\'onglet 1.' };
    }

    const secondSheet = workbook.Sheets[workbook.SheetNames[1]];
    const exclusionsData = XLSX.utils.sheet_to_json(secondSheet, { header: 1, defval: '' });

    const exclusions = new Map();
    for (let i = 1; i < exclusionsData.length; i++) {
        const giver = String(exclusionsData[i][0] || '').trim();
        const excluded = String(exclusionsData[i][1] || '').trim();
        if (giver && excluded && giver.length <= MAX_NAME_LENGTH && excluded.length <= MAX_NAME_LENGTH) {
            const receivers = exclusions.get(giver) ?? [];
            if (!receivers.includes(excluded)) {
                exclusions.set(giver, [...receivers, excluded]);
            }
        }
    }

    return { participants, exclusions };
}
