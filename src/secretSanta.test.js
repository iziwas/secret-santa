import { describe, expect, it } from 'vitest';
import { generateAssignments } from './secretSanta';

// Le tirage est aléatoire : chaque propriété est vérifiée sur de nombreux tirages.
const DRAWS = 200;
const PARTICIPANTS = ['Alice', 'Bob', 'Claire', 'David', 'Emma', 'Farid'];

const toMap = (assignments) =>
    Object.fromEntries(assignments.map(({ giver, receiver }) => [giver, receiver]));

describe('generateAssignments', () => {
    it('fait offrir et recevoir chaque participant exactement une fois', () => {
        for (let i = 0; i < DRAWS; i++) {
            const result = generateAssignments(PARTICIPANTS);
            const sorted = [...PARTICIPANTS].sort();

            expect(result.map(a => a.giver).sort()).toEqual(sorted);
            expect(result.map(a => a.receiver).sort()).toEqual(sorted);
        }
    });

    it("ne fait jamais offrir un participant à lui-même", () => {
        for (let i = 0; i < DRAWS; i++) {
            for (const { giver, receiver } of generateAssignments(PARTICIPANTS)) {
                expect(receiver).not.toBe(giver);
            }
        }
    });

    it('respecte les exclusions', () => {
        const exclusions = { Alice: ['Bob', 'Claire'], David: ['Emma'] };

        for (let i = 0; i < DRAWS; i++) {
            const result = toMap(generateAssignments(PARTICIPANTS, exclusions));

            expect(exclusions.Alice).not.toContain(result.Alice);
            expect(exclusions.David).not.toContain(result.David);
        }
    });

    it("trouve l'unique tirage possible quand les exclusions n'en laissent qu'un", () => {
        const result = generateAssignments(['Alice', 'Bob', 'Claire'], { Alice: ['Claire'] });

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Claire', Claire: 'Alice' });
    });

    it('fait échanger deux participants', () => {
        const result = generateAssignments(['Alice', 'Bob']);

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Alice' });
    });

    it('produit des tirages différents', () => {
        const seen = new Set();

        for (let i = 0; i < DRAWS; i++) {
            seen.add(generateAssignments(['Alice', 'Bob', 'Claire'])[0].receiver);
        }

        expect(seen).toEqual(new Set(['Bob', 'Claire']));
    });

    it('ignore les exclusions visant une personne absente', () => {
        const result = generateAssignments(['Alice', 'Bob'], { Alice: ['Zoé'], Zoé: ['Bob'] });

        expect(toMap(result)).toEqual({ Alice: 'Bob', Bob: 'Alice' });
    });

    it('renvoie null quand aucun tirage ne respecte les exclusions', () => {
        expect(generateAssignments(['Alice', 'Bob'], { Alice: ['Bob'] })).toBeNull();
        expect(generateAssignments(
            ['Alice', 'Bob', 'Claire'],
            { Alice: ['Claire'], Bob: ['Claire'] },
        )).toBeNull();
    });

    it('ne modifie pas ses paramètres', () => {
        const participants = ['Alice', 'Bob', 'Claire'];
        const exclusions = { Alice: ['Bob'] };

        generateAssignments(participants, exclusions);

        expect(participants).toEqual(['Alice', 'Bob', 'Claire']);
        expect(exclusions).toEqual({ Alice: ['Bob'] });
    });
});
