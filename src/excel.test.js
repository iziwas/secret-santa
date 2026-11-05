import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildTemplateWorkbook, parseWorkbook } from './excel';

// Passe par un vrai fichier .xlsx, comme un téléchargement suivi d'un import.
const saveAndReopen = (workbook) =>
    XLSX.read(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }), { type: 'array' });

const appendRows = (workbook, sheetName, rows) => {
    XLSX.utils.sheet_add_aoa(workbook.Sheets[sheetName], rows, { origin: -1 });
};

const workbookOf = (...sheets) => {
    const workbook = XLSX.utils.book_new();
    sheets.forEach((rows, i) => {
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), `Onglet ${i + 1}`);
    });
    return workbook;
};

describe('buildTemplateWorkbook', () => {
    it('propose les participants, les exclusions, puis le mode d\'emploi', () => {
        expect(saveAndReopen(buildTemplateWorkbook()).SheetNames)
            .toEqual(['Participants', 'Exclusions', 'Mode d\'emploi']);
    });

    it('rend les participants et les exclusions saisis dans le modèle', () => {
        const workbook = saveAndReopen(buildTemplateWorkbook());
        appendRows(workbook, 'Participants', [['Zoé'], ['Yann'], ['Xavier']]);
        appendRows(workbook, 'Exclusions', [['Zoé', 'Yann'], ['Zoé', 'Xavier'], ['Yann', 'Zoé']]);

        expect(parseWorkbook(saveAndReopen(workbook))).toEqual({
            participants: ['Zoé', 'Yann', 'Xavier'],
            exclusions: new Map([['Zoé', ['Yann', 'Xavier']], ['Yann', ['Zoé']]]),
        });
    });

    it('accepte un modèle sans exclusions', () => {
        const workbook = saveAndReopen(buildTemplateWorkbook());
        appendRows(workbook, 'Participants', [['Zoé'], ['Yann']]);

        expect(parseWorkbook(saveAndReopen(workbook))).toEqual({
            participants: ['Zoé', 'Yann'],
            exclusions: new Map(),
        });
    });

    it('refuse un modèle vierge au lieu de tirer au sort les exemples', () => {
        expect(parseWorkbook(saveAndReopen(buildTemplateWorkbook()))).toEqual({
            error: 'Aucun participant valide trouvé. Vérifie l\'onglet 1.',
        });
    });
});

describe('parseWorkbook', () => {
    it('refuse un classeur d\'un seul onglet', () => {
        expect(parseWorkbook(workbookOf([['Nom'], ['Alice']]))).toEqual({
            error: 'Le fichier doit contenir au moins 2 onglets.',
        });
    });

    it('ignore la première ligne de chaque onglet', () => {
        const { participants, exclusions } = parseWorkbook(workbookOf(
            [['Alice'], ['Bob']],
            [['Alice', 'Bob'], ['Bob', 'Alice']],
        ));

        expect(participants).toEqual(['Bob']);
        expect(exclusions).toEqual(new Map([['Bob', ['Alice']]]));
    });

    it('nettoie les noms et retire les doublons', () => {
        const { participants, exclusions } = parseWorkbook(workbookOf(
            [['Nom'], ['  Alice '], ['Alice'], [''], ['Bob']],
            [['Donneur', 'Exclu'], [' Alice', 'Bob '], ['Alice', 'Bob'], ['Bob', '']],
        ));

        expect(participants).toEqual(['Alice', 'Bob']);
        expect(exclusions).toEqual(new Map([['Alice', ['Bob']]]));
    });

    it('écarte les noms de plus de 100 caractères', () => {
        const longName = 'a'.repeat(101);
        const { participants, exclusions } = parseWorkbook(workbookOf(
            [['Nom'], ['a'.repeat(100)], [longName]],
            [['Donneur', 'Exclu'], ['Alice', longName], [longName, 'Alice']],
        ));

        expect(participants).toEqual(['a'.repeat(100)]);
        expect(exclusions).toEqual(new Map());
    });

    it.each(['constructor', '__proto__'])('accepte une exclusion pour %s', (name) => {
        const { exclusions } = parseWorkbook(workbookOf(
            [['Nom'], [name], ['Bob']],
            [['Donneur', 'Exclu'], [name, 'Bob']],
        ));

        expect(exclusions.get(name)).toEqual(['Bob']);
    });
});
